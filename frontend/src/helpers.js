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

export const movePage = (currentPage, destinationPage) => {
    let currentPageElement = document.getElementById(currentPage);
    let destinationPageElement = document.getElementById(destinationPage);
    destinationPageElement.classList.remove('d-none');
    currentPageElement.classList.add('d-none')
}

export const checkEmail = (email) => {
    let regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return regexp.test(email.trim());
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

export const getListOfUserDetails = (userIdList) => {
    return new Promise( (resolve, reject) => {
        let userObject = {};
        for (let i = 0; i < userIdList.length ; i++){
            let userData = apiCall(`user/${userIdList[i]}`,'GET').then((response) => {
                let userId = `${userIdList[i]}`;
                userObject[userId] = response;
                if((i+1) === userIdList.length){
                    resolve(userObject);
                }
            })
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
    // let modal = document.getElementById('warning-modal');
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





// export const getCurrentChannel = (channelListObject) => {
    
// }

const channelDetailsSectionGenerator = (title,content) => { 
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

export const refreshChannelContent = (channelId,modalObject=null) => {
    getAllChannels().then((r) => {
        let channelObject = document.getElementById(`${channelId}`);
        getChannelDetails(channelObject);
        if(modalObject !== null){
            modalObject.hide();
        }
    })
}


export const getChannelDetails = (channelListObject) => {
    let channelId = channelListObject.id;
    let userInChannel = channelListObject.getAttribute('data-user-in-channel')
    let channelName = channelListObject.textContent.slice(1)
    let channelPageDiv = document.getElementById('channel-page-section');
    channelPageDiv.replaceChildren();
    let channelNameHeading = document.createElement('h5');
    channelNameHeading.textContent = channelName;
    channelNameHeading.setAttribute('class','text-wrap')
    channelPageDiv.appendChild(channelNameHeading);
    if (userInChannel === 'false'){
        let joinButton = document.createElement('button');
        joinButton.setAttribute('class', 'btn btn-primary my-3');
        joinButton.textContent = 'Join Channel';
        joinButton.setAttribute('aria-label','Join Button');
        channelPageDiv.appendChild(joinButton);
        joinButton.addEventListener('click',(e) => {
            let joinChannel =  apiCall(`channel/${channelId}/join`,'POST');
            joinChannel.then( (response) => {
                if (!response.error) {
                    refreshChannelContent(channelId)
                }
            })
        })
    } else {
        let channelInformation =  apiCall(`channel/${channelId}`,'GET');
        channelInformation.then( (response) => {
            let channelMembers = getListOfUserDetails(response.members).then((members) => {
                let editChannelButton = document.createElement('button');
                editChannelButton.setAttribute('class', 'btn btn-primary mb-2 me-md-2');
                editChannelButton.textContent = 'Edit Channel';
                editChannelButton.setAttribute('aria-label','Edit Channel Button');
                editChannelButton.addEventListener('click', (e) => {
                    editChannelModal.show();
                })

                let editChannelModalBase = createBasicModalStructure();
                let editChannelModal = new bootstrap.Modal(editChannelModalBase);
                let editChannelModalHeader = editChannelModalBase.children[0].children[0].children[0];
                let editChannelModalBody = editChannelModalBase.children[0].children[0].children[1];
                let editChannelModalFooter = editChannelModalBase.children[0].children[0].children[2];
                editChannelModalHeader.children[0].textContent = 'Edit Channel';
                let editChannelFormFormat = [
                    {
                        type: 'input',
                        name: 'Channel Name',
                        value: channelName,
                        attributes: {
                            type: 'text',
                            class: 'form-control mb-2',
                            id: 'edit-channel-name-field'
                        }
                    },
                    {
                        type: 'input',
                        name: 'Channel Description',
                        value: response.description,
                        attributes: {
                            type: 'text',
                            class: 'form-control mb-2',
                            id: 'edit-channel-description-field'
                        },
                    }
                ]
                let editChannelForm = createForm(editChannelFormFormat);
                editChannelModalBody.appendChild(editChannelForm);

                let editChannelModalEditButton = document.createElement('button');
                editChannelModalEditButton.setAttribute('class','btn btn-primary');
                editChannelModalEditButton.textContent = "Edit";
                editChannelModalEditButton.addEventListener('click', (e) => {
                    let edittedChannelName = document.getElementById('edit-channel-name-field').value;
                    let edittedChannelDescription = document.getElementById('edit-channel-description-field').value;
                    let editRequest = {
                        name:edittedChannelName,
                        description: edittedChannelDescription
                    }
                    let editApiRequest = apiCall(`channel/${channelId}`,'PUT',editRequest);
                    editApiRequest.then( (editResponse) => {
                        if (!editResponse.error) {
                            refreshChannelContent(channelId,editChannelModal);
                        }
                        
                    })
                })

                editChannelModalFooter.prepend(editChannelModalEditButton);

                let leaveChannelButton = document.createElement('button');
                leaveChannelButton.setAttribute('class', 'btn btn-danger mb-2');
                leaveChannelButton.textContent = 'Leave Channel';
                leaveChannelButton.setAttribute('aria-label','Leave Channel Button');

                let leaveChannelModalBase = createBasicModalStructure();
                let leaveChannelModal = new bootstrap.Modal(leaveChannelModalBase);
                let leaveChannelModalHeader = leaveChannelModalBase.children[0].children[0].children[0];
                let leaveChannelModalBody = leaveChannelModalBase.children[0].children[0].children[1];
                let leaveChannelModalFooter = leaveChannelModalBase.children[0].children[0].children[2];
                leaveChannelModalHeader.children[0].textContent = 'Warning';
                let confirmationMessage = document.createElement('h5');
                confirmationMessage.textContent = 'Are you sure you want to leave this channel';
                leaveChannelModalBody.appendChild(confirmationMessage);

                let leaveChannelModalConfirmButton = document.createElement('button');
                leaveChannelModalConfirmButton.setAttribute('class','btn btn-primary');
                leaveChannelModalConfirmButton.textContent = "Confirm";

                leaveChannelButton.addEventListener('click', (e) => {
                    leaveChannelModal.show();
                })

                leaveChannelModalConfirmButton.addEventListener('click', (e) => {
                    let leaveChannelApiRequest = apiCall(`channel/${channelId}/leave`,'POST');
                    leaveChannelApiRequest.then( (leaveResponse) => {
                        if (!leaveResponse.error){
                            refreshChannelContent(channelId,leaveChannelModal);
                        }
                    })
                })

                leaveChannelModalFooter.prepend(leaveChannelModalConfirmButton);

                let channelType = channelDetailsSectionGenerator('Channel Type',`${response.private?'Private':'Public'}`);
                let channelCreator = channelDetailsSectionGenerator('Channel Creator',`${members[response.creator].name}`);
                let channelCreationDate = channelDetailsSectionGenerator('Channel Creation Date:',response.createdAt.slice(0,10));
                let channelDescription = channelDetailsSectionGenerator('Channel Description',response.description.length === 0? "No Description":response.description);
                
                let channelMembersText = document.createElement('p');
                channelMembersText.setAttribute('class','fs-6 mb-0');
                channelMembersText.textContent = 'Channel Members:'
                let ulObject = document.createElement('ul');
                ulObject.style.listStylePosition = 'inside';
                ulObject.setAttribute('class','mb-4 mb-md-2 p-0');
               
                for (let member in members){
                    let liObj = document.createElement('li');
                    liObj.setAttribute('class','px-1 py-1 text-nowrap');
                    let aObj = document.createElement('a');
                    aObj.textContent = members[member].name;
                    liObj.appendChild(aObj);
                    ulObject.appendChild(liObj);
                }

                // channelPageDiv.appendChild(channelType[0]);
                // channelPageDiv.appendChild(channelType[1]);
                // channelPageDiv.appendChild(channelCreator[0]);
                // channelPageDiv.appendChild(channelCreator[1]);
                // channelPageDiv.appendChild(channelCreationDate[0]);
                // channelPageDiv.appendChild(channelCreationDate[1]);
                // channelPageDiv.appendChild(channelDescription[0]);
                // channelPageDiv.appendChild(channelDescription[1]);
                channelPageDiv.appendChild(editChannelButton);
                channelPageDiv.appendChild(leaveChannelButton);
                channelPageDiv.appendChild(channelType);
                channelPageDiv.appendChild(channelCreator);
                channelPageDiv.appendChild(channelCreationDate);
                channelPageDiv.appendChild(channelDescription);
                channelPageDiv.appendChild(channelMembersText);
                channelPageDiv.appendChild(ulObject);

            })
        })
    }
}





const createChannelListDiv = (channelArray) => {
    let ulListObject = document.createElement('ul');
    ulListObject.setAttribute('class', 'px-1 w-100 h-100');
    let userId = localStorage.getItem('userId');
    let testChannels = ["channel long long long","channel long long","channel long long","channel long long","channel long long" ,"channel long long" ,"channel long long" ,"channel long long" ,"channel long long"];
    channelArray.forEach( (channel) => {
        let userInChannel = channel.members.includes(Number(userId));
        let liObj = document.createElement('li');
        let aObj = document.createElement('a');
        liObj.setAttribute('class','px-1 text-nowrap');
        aObj.setAttribute('class','link-light link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover focus-ring')
        aObj.textContent = `#${channel.name}`;
        aObj.setAttribute('aria-label',`${channel.name} Page`)
        aObj.setAttribute('tabindex','0');
        aObj.setAttribute('id',`${channel.id}`);
        aObj.setAttribute('data-user-in-channel',userInChannel?'true':'false');
        liObj.style.listStyle = 'none';
        liObj.appendChild(aObj);
        ulListObject.appendChild(liObj);
        liObj.addEventListener('click', (e) => {
            getChannelDetails(aObj);
        })
    })

    // testChannels.forEach( (channel) => {
    //     let liObj = document.createElement('li');
    //     let aObj = document.createElement('a');
    //     liObj.setAttribute('class','px-1 text-nowrap');
    //     aObj.setAttribute('class','link-light link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover ')
    //     aObj.textContent = `#${channel}`;
    //     liObj.appendChild(aObj);
    //     liObj.setAttribute('data-id','1');
    //     liObj.style.listStyle = 'none';
    //     ulListObject.appendChild(liObj);
    // })
    return ulListObject;

}

export const getAllChannels = () => {
    return new Promise( (resolve,reject) => {
        let publicChannelDiv = document.getElementById('channel-list-public');
        let privateChannelDiv = document.getElementById('channel-list-private');
        publicChannelDiv.replaceChildren();
        privateChannelDiv.replaceChildren();
        let channelResponse = apiCall('channel','GET')
        channelResponse.then( (response) => {
            let publicChannels = response.channels.filter((obj) => obj.private === false);
            let privateChannels = response.channels.filter((obj) => obj.private === true);
            let publicChannelUl = createChannelListDiv(publicChannels);
            let privateChannelUl = createChannelListDiv(privateChannels);
            publicChannelDiv.appendChild(publicChannelUl);
            privateChannelDiv.appendChild(privateChannelUl);
            resolve('');
        })
    })
}



// export const checkValidPasswordInput = (inputElement1, inputElement2) => {
//     if(i)
// }