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

import { BACKEND_PORT } from './config.js';


// Function that converts file into base 64
export function fileToDataUrl(file) {
    if(file === null){ //Checks if the passed file is null, if it is null then return nothing
        return new Promise((resolve,reject) => {
            resolve(null);
        })
    } else { //If the file is not null then process it and return the file reader as a promise
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
}


//Function that takes the Date from the the Date Time String Format (YYYY-MM-DDTHH:mm:ss.sssZ -> DD-MM-YYYY)
export const convertDateToDDMMYY = (dateStr) => {
    let date = dateStr.slice(0,10);
    let dateArray = date.split('-');
    let newDateString = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;
    return newDateString;
}

//Function that takes the Date from the the Date Time String Format (YYYY-MM-DDTHH:mm:ss.sssZ -> DD-MM-YYYY)
export const getDateHHMM = (dateStr) => {
    let date = dateStr.slice(11,16);
    return date;
}



//Function that takes checks if an email string is a valid email using regex
export const checkEmail = (email) => {
    let regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return regexp.test(email.trim());
}


/*
Multipurpose Function that is used to call APIs in the backend 
Function Parameters:
 - path : The path of the api such as message or message/userId. 
 - method: The method of the api which should either be 'POST', 'PULL', 'DELETE', 'GET', and other valid HTTP methods
 - body: The Json Object which will be used as the api request body, by default it is null which means there is no request body
 - queryString: The query string for the API path. 
 - showRequestError: Boolean that tells the function if it should show an error modal if the api returned a request error (A request error is where the
    API returns an response.error object ())
 - showConnectionError: Boolean that tells the function if it should show an error modal upon a connection error. A connection error is when the backend is offline or disconnected
*/
export const apiCall = (path, method, body = null ,queryString = null, showRequestError = true, showConnectionError = true) => {
    return new Promise( (resolve, reject) => {
        let isConnectionError = true; //Flag which will be used by the catch block to know the type of error
        let urlString = `http://localhost:${BACKEND_PORT}/${path}${queryString!==null?`?${queryString}`:''}`; //Build the URL String or in this case the api route 
        let token = localStorage.getItem('token'); //Get the user authorization token from the local storage
        let options = {
            method,
            headers: {
                'Content-type': 'application/json',
                ...(token !== null && {'Authorization':token}) //Include the token if there is a token in the localstorage.
            },
            ...(body !== null && {body:JSON.stringify(body)}) //Include the body if a body object is passed in the function parameter
        }
        let apiObj = fetch(urlString,options);
        apiObj
        .then((response) => response.json())
        .then((data) => {
            if(data.error){ //If the error object in the response is not null then create and Throw a new error where the error message is the error message we got from the api request
                isConnectionError = false; 
                throw new Error(data.error)
            } else {
                resolve(data);
            }
        })
        .catch((e) => {
            if(!isConnectionError){ //If it is a response error and not a connection error, then return the error message we got from the backend server 
                reject(e.message);
                if(showRequestError){
                    showMessageModal('Error',e.message);
                }
            } else if(isConnectionError){
                reject('Server Error');
                if(showConnectionError){
                    showMessageModal('Server Error', e.message);
                }
            } 
        })
    })
}


//Function used to move between pages in the Single Page Application by adding and removing the display none class provided by bootstrap to the corresponding page dom element 
export const movePage = (currentPage, destinationPage) => {
    let currentPageElement = document.getElementById(currentPage);
    let destinationPageElement = document.getElementById(destinationPage);
    destinationPageElement.classList.remove('d-none');
    currentPageElement.classList.add('d-none')
}


//Function used in the Register Page to add the valid and invalid class to the registration form input to show the error message hint in the bottom of the inputElement.
export const formInputElementValidator = (inputElement, isValid) => {
    if(isValid){
        inputElement.classList.remove('is-invalid');
        inputElement.classList.add('is-valid');
    } else {
        inputElement.classList.remove('is-valid');
        inputElement.classList.add('is-invalid');
    }
}

//Function used in the Register Page to check if an input value is empty where if its empty then show a warning message using the warning dom element that is passed to the function
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

/*
Function that gets details of all the userIds included in the userIdList using the get user details api. 
When the function is succesfull, it returns an object  that contains the user details where the key of the object is the userId.
Example of the returned object:
{
    userId1: {
        ...detailsOfUserId1
    },
    userId2: {
        ...detailsOfUserId2
    },
    ...
}
*/
export const getObjectOfUserDetails = (userIdList, currentIndex = 0, userObject = {}) => {
    return apiCall(`user/${userIdList[currentIndex]}`,'GET').then((response) => {
        let userId = `${userIdList[currentIndex]}`;
        userObject[userId] = response;
        currentIndex+=1
        if(currentIndex < userIdList.length){ 
            //If the function has not retrieved all the details of the users in the userIdList, then do a recursive call to fetch the next user reffered by the currentIndex variable
            return getObjectOfUserDetails(userIdList,currentIndex,userObject);
        } else { //If the details of all the user have been fetched, then return the userDetails Object.
            return userObject;
        }
    })
}


/*Function that is used to get all messages from a channel, 
Keep in mind this function is NOT used for the infinity scroll, instead it is later used to get all the pinned messages,
and the pinned picture for a channel
*/
export const getAllChannelMessages = (channelId, messages = [], startIndex = 0) => {
    return apiCall(`message/${channelId}`,'GET',null,`start=${startIndex}`).then
    ( (response) => {
        if(response.messages.length == 0){
            startIndex = -1;
        } else {
            startIndex = startIndex + response.messages.length;
            messages = [...messages,...response.messages];
        }
        if(startIndex !== -1){
            return getAllChannelMessages(channelId,messages,startIndex);
        } else {
            return messages;
        }
    })
}


//Function that fetches a channels name using the channelId alone.
export const getSpecificChannelName = (channelId) => {
    return apiCall('channel','GET').then((response) => {
        let specifiedChannel = response.channels.filter((channel) => channel.id === channelId);
        let channelName = specifiedChannel.length>0? specifiedChannel[0].name:'';
        return(channelName);
    })
}

//Function that always returns the latest 25 message from a channel, used for the notification system
export const getChannelLatestMessages = (channelId) => {
    return apiCall(`message/${channelId}`,'GET',null,'start=0',false,false).then
    ( (response) => {
        return response.messages;
    })
}


//Function that is used to invite all the userId's included in the userIdList into a specified channel designated by the channelId in the function parameter.
export const inviteMultipleUsers = (userIdList,channelId,currentIndex = 0) => {
    let apiRequestObject = {
        userId: Number(userIdList[currentIndex])
    }
    return apiCall(`channel/${channelId}/invite`,'POST',apiRequestObject).then((response) => {
        currentIndex+=1
        if(currentIndex < userIdList.length){ //Do a recursive call if not all the users in the userIdList have been invited
            return inviteMultipleUsers(userIdList,channelId,currentIndex);
        } else { //If all the users have been invited then return an empty string just to signify that the promise has been resolved.
            return '';
        }
    })
}


/*
A function that is used to generate a boilercode tempalte of a bootstrap modal. The function has multiple parameters which is:
-modalSize: By default is null but can be changed to modal-sm/modal-lg/modal-xl or modal-fullscreen incase a larger modal needs to be generated
- hasFooter : By default it is true, if hasFooter is false then the modal footer will not be included in the returned modal
- hasHeader: By default it is true, if hasHeader is false then the modal header will not be included in the returned modal and the close button will be put in the modal body
- scrollable: By default it is true, if its false then the modal body wont be scrollable
*/
export const createBasicModalStructure = (modalSize=null,hasFooter = true ,hasHeader = true, scrollable = true) => {
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

    //Create the modalContent Div
    let modalContent = document.createElement('div');
    modalContent.setAttribute('class','modal-content')
    
    if (hasHeader){ //If the hasHeader option is on then add the modal header to the modal
        modalContent.appendChild(modalHeader);
    } else { //If the hasHeader option is off then add the close button to the modal Body
        modalHeaderCloseButton.classList.add('float-end')
        modalBody.appendChild(modalHeaderCloseButton);
    }

    modalContent.appendChild(modalBody);
    if(hasFooter){ //If the hasFooter option is on then add the modal footer to the modal
        modalContent.appendChild(modalFooter);
    }
    
    //Create the modal dialog div
    let modalDialog = document.createElement('div');
    modalDialog.setAttribute('class',`modal-dialog modal-dialog-centered${scrollable?' modal-dialog-scrollable':''}`);
    modalDialog.appendChild(modalContent);
    if(modalSize !== null){
        let modalBody
        modalDialog.classList.add(modalSize);
    }
    

    // Create the modal parent div
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


/*
A function that will show a modal to the user with the corresponding title and message provided in the function parameters
Usually used to show error messages. 
*/
export const showMessageModal = (title,message) => {
    let modalBasic = createBasicModalStructure();
    modalBasic.setAttribute('data-bs-backdrop','static');
    modalBasic.setAttribute('data-bs-keyboard','false');
    modalBasic.children[0].children[0].classList.add('border','border-dark');
    let modalHeader = modalBasic.children[0].children[0].children[0];
    let modalBody = modalBasic.children[0].children[0].children[1];
    modalHeader.children[0].textContent = title;
    modalBody.textContent = message;
    let modal = modalBasic;
    const myModal = new bootstrap.Modal(modal)
    myModal.show();
}


/*
A function that is used to generate a confirmation modal that is used throughout the application for
actions that requires extra confirmation like a delete or edit. 
*/
export const createConfirmationModal = (title,bodyMessage) => {
    let confirmationModalBase = createBasicModalStructure();
    let confirmationModalHeader = confirmationModalBase.children[0].children[0].children[0];
    let confirmationModalBody = confirmationModalBase.children[0].children[0].children[1];
    let confirmationModalFooter = confirmationModalBase.children[0].children[0].children[2];
    confirmationModalHeader.children[0].textContent = title;
    let confirmationMessage = document.createElement('h5');
    confirmationMessage.textContent = bodyMessage;
    confirmationModalBody.appendChild(confirmationMessage);

    let confirmButton = document.createElement('button');
    confirmButton.setAttribute('class','btn btn-primary');
    confirmButton.textContent = 'Confirm';

    confirmationModalFooter.prepend(confirmButton);
    return confirmationModalBase;
}


/*
Function used by the createForm function to get the attribute name of the attributes specified for an element
as javascript does not allow us to use '-' in objects which prevent us from creating an object where the key is something like aria-label,
this function allows us to bypass it.
*/
const getAttributeName = (attributeName) => {
    if(attributeName.slice(0,4) === 'aria'){
        let ariaAttributeName = attributeName.split('_');
        return `${ariaAttributeName[0]-ariaAttributeName[1]}`;
    } else {
        return attributeName;
    }
}

/*
Function used to generate a form object where the element inside the form can be an input, a select element, or a text area.
The formFormat is an array object that tells the function the elements to be generated. 
Each object in the formFormat array describes the element that we want to put inside the form and for each element, this function will also automatically generate a lable for it.
Example of the form format is as follows:
    {
    type: elementType (can be 'input', 'textarea', or 'select'),
    name: Name of the field ,
    attributes: { //Attribute objects which holds the attributes we want to add the to the input/textarea/select element, below is an example that we can use for an input
        type: The type of the input incase we are making input elements such as 'text' 'emai' or other valid values,
        class: The class we want to apply to the element,
        id: The id of the element so that we can apply a lable for it
    }
Additionaly for select elements we also need to add an additional key inside the object called the selectOptions array which is used by the function to generate the options object. 
here is an example taken from the main code:
        {
            type: 'select',
            name: 'Choose your Channel Type',
            attributes: {
                type: 'select',
                class: 'form-select',
                id: 'create-channel-channel-type',
                aria_label: 'Channel type selection'
            },
            selectOptions: [ //the select options, can be more than 2
                {
                    displayText: "Public",
                    attributes: {
                        value: 'public',
                        selected: ''
                    }
                },
                {
                    displayText: "Private",
                    attributes: {
                        value: 'private'
                    }
                }
            ]
        }
*/
export const createForm = (formFormat) => {
    let form = document.createElement('form');
    for (const formFieldObj of formFormat){ //Loop over all the objects inside the formFormat array
        let label = document.createElement('label'); 
        let element = document.createElement(formFieldObj.type);
        let elementName = formFieldObj.name;
        let elementAttributes = formFieldObj.attributes;
        label.setAttribute('for',elementAttributes.id);
        label.setAttribute('class','form-label fs-6');
        label.textContent = elementName;
        for (let attribute in elementAttributes){ //Iterate over the keys inside the attribute property and add them as an attribute
            let attributeName = getAttributeName(attribute)
            element.setAttribute(`${attributeName}`,elementAttributes[attribute]);
        }
        if (formFieldObj.value) {
            element.value = formFieldObj.value;
        }
        form.appendChild(label);
        if (formFieldObj.type === 'select') { //If its a select element then also generate the select options
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

/*
Helper Function used to generate the Channel Details Text Elements for when the user is member of the channel
(Channel Details is the right section of the main page that shows the detail of a channel) 
*/
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
