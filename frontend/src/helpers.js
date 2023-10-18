/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type='file']').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */

import { BACKEND_PORT } from "./config.js";

export function fileToDataUrl(file) {
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}

export const convertDateToDDMMYY = (dateStr) => {
    let date = dateStr.slice(0,10);
    let dateArray = date.split('-');
    let newDateString = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;
    return newDateString;
}

export const getDateHHMM = (dateStr) => {
    let date = dateStr.slice(11,16);
    return date;
}


export const checkEmail = (email) => {
    let regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return regexp.test(email.trim());
}


export const apiCall = (path, method, body = null ,queryString = null) => {
    return new Promise( (resolve, reject) => {
        let urlString = `http://localhost:${BACKEND_PORT}/${path}${queryString!==null?`?${queryString}`:""}`;
        let token = localStorage.getItem('token');
        let options = {
            method,
            headers: {
                'Content-type': 'application/json',
                ...(token !== null && {'Authorization':token})
            },
            ...(body !== null && {body:JSON.stringify(body)})
        }
        let apiObj = fetch(urlString,options);
        apiObj
        .then((response) => response.json())
        .then((data) => {
            if(data.error){
                showWarningModal('Error',data.error)
            } else {
                resolve(data);
            }
        })
        .catch((e) => {
            showWarningModal('Server Error', e)
        })
    })
}


export const movePage = (currentPage, destinationPage) => {
    let currentPageElement = document.getElementById(currentPage);
    let destinationPageElement = document.getElementById(destinationPage);
    destinationPageElement.classList.remove('d-none');
    currentPageElement.classList.add('d-none')
}



export const formInputElementValidator = (inputElement, isValid) => {
    if(isValid){
        inputElement.classList.remove('is-invalid');
        inputElement.classList.add('is-valid');
    } else {
        inputElement.classList.remove('is-valid');
        inputElement.classList.add('is-invalid');
    }
}

export const emptyInputValidator = (inputElement,warningElement,fieldName ,trim = true) => {
    let inputValue = trim?inputElement.value.trim():inputElement.value;
    if(inputValue.length === 0){
        if(warningElement !== null){
            warningElement.textContent = `${fieldName} cannot be empty`
        }
        formInputElementValidator(inputElement, false);
        return true;
    } else {
        formInputElementValidator(inputElement, true);
        return false;
    }
}

export const getListOfUserDetails = (userIdList, currentIndex = 0, userObject = {}) => {
    return apiCall(`user/${userIdList[currentIndex]}`,'GET').then((response) => {
        let userId = `${userIdList[currentIndex]}`;
        userObject[userId] = response;
        currentIndex+=1
        if(currentIndex < userIdList.length){
            return getListOfUserDetails(userIdList,currentIndex,userObject);
        } else {
            return userObject;
        }
    })
}

export const getListOfPinnedMessages = (channelId, pinnedMessages = [], startIndex = 0) => {
    return apiCall(`message/${channelId}`,'GET',null,`start=${startIndex}`).then
    ( (response) => {
        if(response.messages.length == 0){
            startIndex = -1;
        } else {
            startIndex = startIndex + response.messages.length;
            let tempPinnedMessages = response.messages.filter((message) => message.pinned === true);
            pinnedMessages = [...pinnedMessages,...tempPinnedMessages];
        }
        if(startIndex !== -1){
            return getListOfPinnedMessages(channelId,pinnedMessages,startIndex);
        } else {
            return pinnedMessages;
        }
    })
}

export const createBasicModalStructure = () => {
    //Create the Modal Header
    let modalHeader = document.createElement('div');
    modalHeader.setAttribute('class','modal-header');
    let modalHeading = document.createElement('h1');
    modalHeading.setAttribute('class','modal-title fs-5');
    modalHeading.setAttribute('id','generated-modal-title');
    modalHeading.textContent = 'Modal Title';
    let modalHeaderCloseButton = document.createElement('button');
    modalHeaderCloseButton.setAttribute('class','btn-close');
    modalHeaderCloseButton.setAttribute('type','button');
    modalHeaderCloseButton.setAttribute('data-bs-dismiss','modal');
    modalHeaderCloseButton.setAttribute('aria-label','Close');
    modalHeader.appendChild(modalHeading);
    modalHeader.appendChild(modalHeaderCloseButton);
    
    //Create the Modal Body
    let modalBody = document.createElement('div');
    modalBody.setAttribute('class','modal-body');

    //Create the Modal Footer
    let modalFooter = document.createElement('div');
    modalFooter.setAttribute('class','modal-footer');
    let closeButton = document.createElement('button');
    closeButton.setAttribute('type','button');
    closeButton.setAttribute('class','btn btn-secondary');
    closeButton.setAttribute('data-bs-dismiss','modal');
    closeButton.textContent = 'Close';
    modalFooter.appendChild(closeButton);

    let modalContent = document.createElement('div');
    modalContent.setAttribute('class','modal-content')
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    
    let modalDialog = document.createElement('div');
    modalDialog.setAttribute('class','modal-dialog modal-dialog-centered modal-dialog-scrollable');
    modalDialog.appendChild(modalContent);
    

    let modalDiv = document.createElement('div');
    modalDiv.setAttribute('class','modal fade');
    modalDiv.setAttribute('tabindex','-1');
    modalDiv.setAttribute('aria-labelledby','generated-modal-title');
    modalDiv.setAttribute('aria-hidden','true');
    modalDiv.appendChild(modalDialog);

    modalDiv.addEventListener('hidden.bs.modal',(e) => {
        modalDiv.remove();
    })

    return modalDiv;
}

export const showWarningModal = (title,message) => {
    let modalBasic = createBasicModalStructure();
    modalBasic.setAttribute('data-bs-backdrop','static');
    modalBasic.setAttribute('data-bs-keyboard','false');
    let modalHeader = modalBasic.children[0].children[0].children[0];
    let modalBody = modalBasic.children[0].children[0].children[1];
    modalHeader.classList.add('text-warning');
    modalHeader.children[0].textContent = "Error";
    modalBody.textContent = message;
    let modal = modalBasic;
    const myModal = new bootstrap.Modal(modal)
    myModal.show();
}

export const getAttributeName = (attributeName) => {
    if(attributeName.slice(0,4) === 'aria'){
        let ariaAttributeName = attributeName.split('_');
        return `${ariaAttributeName[0]-ariaAttributeName[1]}`;
    } else {
        return attributeName;
    }
}


export const createForm = (formFormat) => {
    let form = document.createElement('form');
    for (const formFieldObj of formFormat){
        let label = document.createElement('label');
        let element = document.createElement(formFieldObj.type);
        let elementName = formFieldObj.name;
        let elementAttributes = formFieldObj.attributes;
        label.setAttribute('for',elementAttributes.id);
        label.setAttribute('class','form-label fs-6');
        label.textContent = elementName;
        for (let attribute in elementAttributes){
            let attributeName = getAttributeName(attribute)
            element.setAttribute(`${attributeName}`,elementAttributes[attribute]);
        }
        if (formFieldObj.value) {
            element.value = formFieldObj.value;
        }
        form.appendChild(label);
        if (formFieldObj.type === 'select') {
            for (let optionObj of formFieldObj.selectOptions){
                let option = document.createElement('option')
                option.textContent = optionObj.displayText;
                for (let optionAttribute in optionObj.attributes){
                    let optionAttributeName = getAttributeName(optionAttribute)
                    option.setAttribute(`${optionAttributeName}`,optionObj.attributes[optionAttribute]);
                }   
                element.appendChild(option);
            }
        }
        form.appendChild(element);
    }
    return form;

}

export const channelDetailsSectionGenerator = (title,content) => { 
    let div = document.createElement('div');

    let titleElement = document.createElement('p');
    titleElement.setAttribute('class','fs-6 mb-0');
    titleElement.textContent = `${title}:`
    
    let contentElement = document.createElement('p');
    contentElement.setAttribute('class','fs-6');
    contentElement.textContent = content;
    div.setAttribute('class', 'mb-3 mb-md-2');
    div.appendChild(titleElement);
    div.appendChild(contentElement);
    return div;
}

export const offsetMessagesScroll = (offset) => {
    let channelMessagesDiv = document.getElementById('channel-messages');
    channelMessagesDiv.scrollTop = offset;
}


export const createMessage = (messageObj) => {
    let chatBoxDiv = document.createElement('div');
    chatBoxDiv.setAttribute('class','message-chatbox d-flex flex-row flex-wrap border-top border-bottom border-dark px-2');
    if (messageObj.index){
        chatBoxDiv.setAttribute('data-index', messageObj.index);
    }
    let messagePictureSection = document.createElement('div');
    messagePictureSection.setAttribute('class','message-user-picture-section');

    let userProfilePictureDiv = document.createElement('div');
    userProfilePictureDiv.setAttribute('class','message-user-picture rounded-circle m-1 border border-dark');
    
    let messageContentSectionDiv = document.createElement('div');
    messageContentSectionDiv.setAttribute('class','message-content-section d-flex flex-column');
    
    let messageHeaderSection = document.createElement('div');
    messageHeaderSection.setAttribute('class','pb-2 d-flex flex-row d-flex justify-content-between border-bottom border-dark-subtle text-wrap');
    
    let messageSenderName = document.createElement('p');
    messageSenderName.setAttribute('class','me-4 mb-0 fs-6');
    messageSenderName.textContent = messageObj.sender;

    let messageSendTime = document.createElement('p');
    messageSenderName.setAttribute('class','mb-0 fs-6 text-secondary');
    messageSendTime.textContent = messageObj.messageTime;

    let messageContentSection = document.createElement('div');
    messageContentSection.setAttribute('class','message-content text-wrap py-1');
    if(messageObj.image !== null) {
        let imageDiv = document.createElement('div');
        imageDiv.setAttribute('class','image-content');
        imageDiv.style.backgroundImage = messageObj.image;
        messageContentSection.appendChild(imageDiv);
    } else {
        let bodyText = document.createElement('p');
        bodyText.setAttribute('class','fs-6');
        bodyText.textContent = messageObj.message;
        messageContentSection.appendChild(bodyText);
    }

    let messageFooterDiv = document.createElement('div');
    messageFooterDiv.setAttribute('class','message-footer w-100 text-wrap border-top border-dark-subtle pt-2 pb-2 d-flex flex-row d-flex justify-content-between border-bottom border-dark-subtle');

    let messageFooterEdittedText = document.createElement('p');
    messageFooterEdittedText.setAttribute('class','fs-6');

    let reactionsDiv = document.createElement('div');
    reactionsDiv.setAttribute('class','d-flex gap-1 flex-row');

    let emojiButton1 = document.createElement('button')
    emojiButton1.setAttribute('class','btn btn-light border border-dark emoji-button p-1');
    emojiButton1.textContent = `${String.fromCodePoint(128515)} 0`;

    let emojiButton2 = document.createElement('button')
    emojiButton2.setAttribute('class','btn btn-light border border-dark emoji-button p-1');
    emojiButton2.textContent = `${String.fromCodePoint(128516)} 0`;

    let emojiButton3 = document.createElement('button')
    emojiButton3.setAttribute('class','btn btn-light border border-dark emoji-button p-1');
    emojiButton3.textContent = `${String.fromCodePoint(128517)} 0`; 

    messageHeaderSection.appendChild(messageSenderName);
    messageHeaderSection.appendChild(messageSendTime);  

    reactionsDiv.appendChild(emojiButton1);
    reactionsDiv.appendChild(emojiButton2);
    reactionsDiv.appendChild(emojiButton3);

    messageFooterDiv.appendChild(messageFooterEdittedText);
    messageFooterDiv.appendChild(reactionsDiv);

    messageContentSectionDiv.appendChild(messageHeaderSection);
    messageContentSectionDiv.appendChild(messageContentSection);
    
    messagePictureSection.appendChild(userProfilePictureDiv);
    chatBoxDiv.appendChild(messagePictureSection);
    chatBoxDiv.appendChild(messageContentSectionDiv);
    chatBoxDiv.appendChild(messageFooterDiv)
    return chatBoxDiv;
    // if(chatBoxDivParent === "channel-messages"){
    //     messagesDiv.insertBefore(chatBoxDiv,spinner);
    // } else {
    //     messagesDiv.appendChild(chatBoxDiv);
    // }
}