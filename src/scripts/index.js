/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { initialCards } from "./cards.js";
import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { getCardList, getUserInfo, setUserInfo, setUserAvatar, addNewCard, changeLikeCardStatus, deleteCardFromServer } from './components/api.js';

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input_type_avatar");

const logoElement = document.querySelector(".header__logo");
const infoModalWindow = document.querySelector(".popup_type_info");
const infoModalTitle = infoModalWindow.querySelector(".popup__title");
const infoDefinitionList = infoModalWindow.querySelector(".popup__info");
const infoModalText = infoModalWindow.querySelector(".popup__text");
const infoPopularList = infoModalWindow.querySelector(".popup__list");

const infoDefinitionTemplate = document.getElementById("popup-info-definition-template").content;
const infoUserPreviewTemplate = document.getElementById("popup-info-user-preview-template").content;

let currentUserId = null;

const handleLikeCard = (likeButton, likeCounter, cardId) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeCard(likeButton, likeCounter, updatedCard.likes, currentUserId);
    })
    .catch((err) => {
      console.log(err);
    });
};

const createInfoConfig = (term, description) => {
  const element = infoDefinitionTemplate.querySelector(".popup__info-item").cloneNode(true);
  element.querySelector(".popup__info-term").textContent = term;
  element.querySelector(".popup__info-description").textContent = description;
  return element;
}

const createPopularCardBange = (cardName) => {
  const element = infoUserPreviewTemplate.querySelector(".popup__list-item").cloneNode(true);
  element.textContent = cardName;
  return element;
}

const handleLogoClick = () => {
  getCardList()
  .then((cards)=>{
    infoDefinitionList.replaceChildren();
    infoPopularList.replaceChildren();

    infoModalTitle.textContent = "Статистика карточек";
    infoModalText.textContent = "Популярные карточки:";

    const uniqueUsers = new Set(cards.map((card) => card.owner._id));
    const totalUsers = uniqueUsers.size;
    const totalLikes = cards.reduce((sum, card) => sum + card.likes.length, 0);

    const likesByUser = new Map();
    cards.forEach((card) => {
      card.likes.forEach((user) => {
        if (likesByUser.has(user._id)) {
          likesByUser.get(user._id).count += 1;
        } else {
          likesByUser.set(user._id, { name: user.name, count: 1 });
        }
      });
    });

    let maxLikesFromOne = 0;
    let likesChampion = "-";

    likesByUser.forEach((userData) => {
      if (userData.count > maxLikesFromOne) {
        maxLikesFromOne = userData.count;
        likesChampion = userData.name;
      }
    });

    infoDefinitionList.append(
      createInfoConfig("Всего пользователей:", totalUsers),
      createInfoConfig("Всего лайков:", totalLikes),
      createInfoConfig("Максимально лайков от одного:", maxLikesFromOne),
      createInfoConfig("Чемпион лайков:", likesChampion)
    );

    const popularCards = [...cards]
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 3);

    popularCards.forEach((card) => {
      infoPopularList.append(createPopularCardBange(card.name));
    });

    openModalWindow(infoModalWindow);
  })
  .catch((err) => {
    console.log(err);
  })
}

const handleDeleteCard = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => {
      deleteCard(cardElement);
    })
    .catch((err) => {
      console.log(err);
    });
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const renderLoading = (isLoading, buttonElement, initialText = "Сохранить", loadingText = "Сохранение...") => {
  if (isLoading) {
    buttonElement.textContent = loadingText;
  } else {
    buttonElement.textContent = initialText;
  }
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const initialText = submitButton.textContent;
  renderLoading(true, submitButton, initialText, "Сохранение...");
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
  .then((userData)=>{
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    closeModalWindow(profileFormModalWindow);
  })
  .catch((err)=>{
    console.log(err)
  })
  .finally(() => {
      renderLoading(false, submitButton, initialText);
  });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const initialText = submitButton.textContent;
  renderLoading(true, submitButton, initialText, "Сохранение...");
  setUserAvatar(
    {avatar : avatarInput.value,}
  )
  .then((userData) => {
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    closeModalWindow(avatarFormModalWindow);
  })
  .catch((err)=>{
    console.log(err)
  })
  .finally(() => {
      renderLoading(false, submitButton, initialText);
  });
  
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const initialText = submitButton.textContent;
  renderLoading(true, submitButton, initialText, "Создание...");
  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
  .then((newCard) => {
    const cardElement = createCardElement(newCard, {
      onPreviewPicture: handlePreviewPicture,
      onLikeIcon: handleLikeCard,
      onDeleteCard: handleDeleteCard,
    }, currentUserId);
    placesWrap.prepend(cardElement);
    closeModalWindow(cardFormModalWindow);
  })
  .catch((err)=>{
    console.log(err)
  })
  .finally(() => {
      renderLoading(false, submitButton, initialText);
  });
};

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
logoElement.addEventListener("click", handleLogoClick);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  
  clearValidation(profileForm, validationSettings);
  
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  
  clearValidation(avatarForm, validationSettings);
  
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  
  clearValidation(cardForm, validationSettings);
  
  openModalWindow(cardFormModalWindow);
});

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

enableValidation(validationSettings);

// getCardList()
//   .then((cards) => {
//     console.log(cards); // В консоли появится массив карточек от сервера
//   })
//   .catch((err) => {
//     console.error('Ошибка:', err);
//   });

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    currentUserId = userData._id;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    cards.forEach((card) => {
      const cardElement = createCardElement(card, {
        onPreviewPicture: handlePreviewPicture,
        onLikeIcon: handleLikeCard,
        onDeleteCard: handleDeleteCard,
      }, currentUserId);
      placesWrap.append(cardElement);
    })
  })
  .catch((err) => {
    console.log(err);
  })
  