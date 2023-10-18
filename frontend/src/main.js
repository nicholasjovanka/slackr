// A helper you may want to use when uploading new images to the server.
import { 
    fileToDataUrl, 
    showWarningModal,
    movePage,checkEmail, 
    formInputElementValidator, 
    emptyInputValidator,
    apiCall, 
    createBasicModalStructure, 
    createForm, 
    createMessage, 
    convertDateToDDMMYY,
    getDateHHMM,
    getListOfUserDetails,
    channelDetailsSectionGenerator,
    getListOfPinnedMessages
} from './helpers.js';

/*
Login Page Code
*/
let loginPageRegisterButton = document.getElementById('login-page-register-button');
loginPageRegisterButton.addEventListener('click', (e) => {
    movePage('login-page', 'register-page');
})

let loginPageLoginButton = document.getElementById('login-page-login-button');
let loginPageNameInput = document.getElementById('login-email-input');
let loginPagePasswordInput = document.getElementById('login-password-input');


loginPageLoginButton.addEventListener('click',(e) => {
    e.preventDefault();
    loginPageLoginButton.disabled = true;
    let body = {
        email: loginPageNameInput.value,
        password: loginPagePasswordInput.value
    }
    let loginAPI = apiCall('auth/login','POST',body);
    loginAPI.then( (response) => {
        localStorage.setItem('token',`Bearer ${response.token}`);
        localStorage.setItem('userId',response.userId)
        movePage('login-page','main-page');
    })
    .finally( () => {
        loginPageLoginButton.disabled = false;
    });
})




/*
Register Page Code
*/
let registerPageNameInput = document.getElementById('register-name-input');

const validateRegisterPageNameInput = () => {
    let registerNameWarningDiv = document.getElementById('register-name-invalid-message');
    emptyInputValidator(registerPageNameInput,registerNameWarningDiv,"Name");
}

registerPageNameInput.addEventListener('blur', (e) => {
    validateRegisterPageNameInput();
})


let registerPageEmailInput = document.getElementById('register-email-input');

const validateRegisterPageEmailInput = () => {
    let registerEmailWarningDiv = document.getElementById('register-email-invalid-message');
    let isEmpty = emptyInputValidator(registerPageEmailInput,registerEmailWarningDiv,"Email");
    if(!isEmpty) {
        let emailIsValid = checkEmail(registerPageEmailInput.value);
        if (!emailIsValid) {
            registerEmailWarningDiv.textContent = "Wrong Email Format";
        }
        formInputElementValidator(registerPageEmailInput, emailIsValid);
    }
}

registerPageEmailInput.addEventListener('blur', (e) => {
    validateRegisterPageEmailInput();
})

let registerPagePasswordInput = document.getElementById('register-password-input');
let registerPageConfirmPasswordInput = document.getElementById('register-confirm-password-input');

const validateRegisterPagePasswordInput = () => {
    let registerPasswordWarningDiv = document.getElementById('register-password-invalid-message');
    let valid = true;
    if(registerPagePasswordInput.value.length === 0 || registerPageConfirmPasswordInput.value.length === 0){
        registerPasswordWarningDiv.textContent = `${registerPagePasswordInput.value.length === 0?'Password':'Confirm Password'} field cannot be empty`
        valid = false;
    } else {
        if(registerPagePasswordInput.value === registerPageConfirmPasswordInput.value) {
            valid = true;
        } else {
            valid = false;
            registerPasswordWarningDiv.textContent = "Password must be the same"
        }
    }
    formInputElementValidator(registerPagePasswordInput, valid);
    formInputElementValidator(registerPageConfirmPasswordInput, valid);

}

registerPagePasswordInput.addEventListener('blur', (e) => {
    validateRegisterPagePasswordInput();
})

registerPageConfirmPasswordInput.addEventListener('blur', (e) => {
    validateRegisterPagePasswordInput();
})


let registerPageLoginHyperLink = document.getElementById('register-page-a-element');

registerPageLoginHyperLink.addEventListener('click', (e) => {
    e.preventDefault();
    movePage('register-page','login-page');
})

let registerPageButton = document.getElementById('register-page-submit-button');

registerPageButton.addEventListener('click', (e) => {
    e.preventDefault();
    registerPageButton.disabled = true;
    if(registerPagePasswordInput.value === registerPageConfirmPasswordInput.value){
        let body = {
            name: registerPageNameInput.value,
            email: registerPageEmailInput.value,
            password: registerPagePasswordInput.value
        }
        let registerApi = apiCall('auth/register','POST',body);
        registerApi.then( (response) => {
            localStorage.setItem('token',`Bearer ${response.token}`);
            localStorage.setItem('userId',response.token)
            movePage('register-page','main-page');
        })
        .catch( (e) => {})
        .finally( () => {
            registerPageButton.disabled = false;
        });
    } else {
        showWarningModal('Error','The Password Field and the Confirm Password Field does not have the same value');
    }
})



/*
Main Page Code
*/
let openButton = document.getElementById('open-button');
let channelBar = document.getElementById('channel-list-sidebar');
openButton.addEventListener('click',(e) => {
    let isOpen = channelBar.classList.contains('slide-in');
    if(isOpen){
        channelBar.classList.remove('slide-in');
        channelBar.classList.add('slide-out');
        openButton.textContent = " > ";
    } else {
        channelBar.classList.remove('slide-out');
        channelBar.classList.add('slide-in');
        openButton.textContent = " < ";
    }
})


let mainPageStateObject = {
    startIndex: 0,
    userInChannel: false,
    channelId: "",
    userList: []
}

let messageWindow = document.getElementById('channel-messages');


localStorage.setItem('token', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTQ0NiIsImlhdCI6MTY5NzM1NDg3NX0.ujbOdP_Zdc3AF-u3mQo0CH7hKIx_-cYXcADdSeF0C5A')
localStorage.setItem('userId', '99446');

const getChannelData = (channelListObject) => {
    removeInfiniteScroll();
    let channelId = channelListObject.id;
    let channelName = channelListObject.textContent.slice(1);
    let channelInputDiv = document.getElementById('channel-input-div');
    messageWindow.replaceChildren();
    let userInChannel = channelListObject.getAttribute('data-user-in-channel') === 'false'?false:true;
    getChannelDetails(channelId,channelName,userInChannel).then((userList) => {
        mainPageStateObject = {
            startIndex: 0,
            channelId,
            userInChannel,
            userList
        }
        if(userInChannel){
            let loadingSpinnerDiv = document.createElement('div');
            loadingSpinnerDiv.setAttribute('class','d-none d-flex justify-content-center');
            loadingSpinnerDiv.setAttribute('id','chatbox-spinner');
            loadingSpinnerDiv.setAttribute('role','status');
            messageWindow.appendChild(loadingSpinnerDiv);

            let loadingSpinner = document.createElement('div');
            loadingSpinner.setAttribute('class','spinner-border');
            loadingSpinnerDiv.appendChild(loadingSpinner);

            messageWindow.addEventListener("scroll", handleInfiniteScroll);
            getChannelMessages(channelId,userList);
        }
    })
}


const createChannelListDiv = (channelArray) => {
    let ulListObject = document.createElement('ul');
    ulListObject.setAttribute('class', 'px-1 w-100 h-100');
    let userId = localStorage.getItem('userId');
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
            getChannelData(aObj);
        })
    })
    return ulListObject;

}

const getAllChannels = () => {
    return new Promise( (resolve,reject) => {
        let publicChannelDiv = document.getElementById('channel-list-public');
        let privateChannelDiv = document.getElementById('channel-list-private');
        publicChannelDiv.replaceChildren();
        privateChannelDiv.replaceChildren();
        let channelResponse = apiCall('channel','GET');
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

const refreshChannelList = (channelId,modalObject=null) => {
    getAllChannels().then((r) => {
        let channelObject = document.getElementById(`${channelId}`);
        getChannelData(channelObject);
        if(modalObject !== null){
            modalObject.hide();
        }
    })
}

const getChannelDetails = (channelId, channelName, userInChannel) => {
    return new Promise( (resolve, reject) => {
        let channelPageDiv = document.getElementById('channel-page-section');
        channelPageDiv.replaceChildren();
        let channelNameHeading = document.createElement('h5');
        channelNameHeading.textContent = channelName;
        channelNameHeading.setAttribute('class','text-wrap')
        channelPageDiv.appendChild(channelNameHeading);
        // getChannelMessages(channelListObject);
        if (!userInChannel){
            let joinButton = document.createElement('button');
            joinButton.setAttribute('class', 'btn btn-primary my-3');
            joinButton.textContent = 'Join Channel';
            joinButton.setAttribute('aria-label','Join Button');
            channelPageDiv.appendChild(joinButton);
            joinButton.addEventListener('click',(e) => {
                let joinChannel =  apiCall(`channel/${channelId}/join`,'POST');
                joinChannel.then( (response) => {
                    if (!response.error) {
                        refreshChannelList(channelId)
                    }
                })
            })  
            resolve(null);
        } else {
            let channelInformation =  apiCall(`channel/${channelId}`,'GET');
            channelInformation.then( (response) => {
                getListOfUserDetails(response.members).then((members) => {
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
                                refreshChannelList(channelId,editChannelModal);
                            }
                            
                        })
                    })

                    editChannelModalFooter.prepend(editChannelModalEditButton);

                    let leaveChannelButton = document.createElement('button');
                    leaveChannelButton.setAttribute('class', 'btn btn-danger mb-2 me-md-2');
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
                                refreshChannelList(channelId,leaveChannelModal);
                            }
                        })
                    })

                    leaveChannelModalFooter.prepend(leaveChannelModalConfirmButton);

                    let pinnedMessageButton = document.createElement('button');
                    pinnedMessageButton.setAttribute('class', 'btn btn-light border border-dark mb-2');
                    pinnedMessageButton.textContent = 'View Pinned Messages';
                    pinnedMessageButton.setAttribute('aria-label','View Pinned Message Button');

                    let pinnedMessageModalBase = createBasicModalStructure();
                    let pinnedMessageModal = new bootstrap.Modal(pinnedMessageModalBase);
                    let pinnedMessageModalHeader = pinnedMessageModalBase.children[0].children[0].children[0];
                    let pinnedMessageModalBody = pinnedMessageModalBase.children[0].children[0].children[1];
                    let pinnedMessageModalFooter = pinnedMessageModalBase.children[0].children[0].children[2];
                    pinnedMessageModalHeader.children[0].textContent = 'Pinned Messages';
                    let pinnedMessagesDiv = document.createElement('div');
                    pinnedMessagesDiv.setAttribute('class','w-100 pt-1 d-flex flex-column gap-2');
                    pinnedMessagesDiv.setAttribute('id','pinned-messages');
            
                    pinnedMessageButton.addEventListener('click', (e) => {
                        pinnedMessagesDiv.replaceChildren();
                        getListOfPinnedMessages(channelId).then( (messages) => {
                            messages.forEach((message) => {
                                let messageObject = {
                                    sender: members[message.sender].name,
                                    userimage: members[message.sender].image,
                                    messageTime: `${convertDateToDDMMYY(message.sentAt)} ${getDateHHMM(message.sentAt)}`,
                                    message: message.message,
                                    image: message.image?message.image:null,
                                    edited: message.edited,
                                    editedAt: message.edited?`${convertDateToDDMMYY(message.editedAt)} ${getDateHHMM(message.editedAt)}`:null,
                                    pinned: message.pinned,
                                    reacts: message.reacts,
                                }
                                let chatBoxDiv = createMessage(messageObject);
                                pinnedMessagesDiv.appendChild(chatBoxDiv);
                            })
                            pinnedMessageModalBody.appendChild(pinnedMessagesDiv);
                            pinnedMessageModal.show();
                        });
                    })

                    let channelType = channelDetailsSectionGenerator('Channel Type',`${response.private?'Private':'Public'}`);
                    let channelCreator = channelDetailsSectionGenerator('Channel Creator',`${members[response.creator].name}`);
                    let channelCreationDate = channelDetailsSectionGenerator('Channel Creation Date:',convertDateToDDMMYY(response.createdAt));
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
                    channelPageDiv.appendChild(editChannelButton);
                    channelPageDiv.appendChild(leaveChannelButton);
                    channelPageDiv.appendChild(pinnedMessageButton);
                    channelPageDiv.appendChild(channelType);
                    channelPageDiv.appendChild(channelCreator);
                    channelPageDiv.appendChild(channelCreationDate);
                    channelPageDiv.appendChild(channelDescription);
                    channelPageDiv.appendChild(channelMembersText);
                    channelPageDiv.appendChild(ulObject);
                    resolve(members);
                })
            })
        }
    })
}




getAllChannels().catch((e) => {});

let createChannelButton = document.getElementById('create-channel-button');
createChannelButton.addEventListener('click', (e) => {
    let modal = createBasicModalStructure();
    let myModal = new bootstrap.Modal(modal);
    let modalHeader = modal.children[0].children[0].children[0];
    let modalBody = modal.children[0].children[0].children[1];
    let modalFooter = modal.children[0].children[0].children[2];
    modalHeader.children[0].textContent = 'Create New Channel';
    let createChannelFormFormat = [
        {
            type: 'input',
            name: 'Channel Name',
            attributes: {
                type: 'text',
                class: 'form-control mb-2',
                id: 'create-channel-name-field'
            }
        },
        {
            type: 'input',
            name: 'Channel Description',
            attributes: {
                type: 'text',
                class: 'form-control mb-2',
                id: 'create-channel-description-field'
            }
        },
        {
            type: 'select',
            name: 'Choose your Channel Type',
            attributes: {
                type: 'select',
                class: 'form-select',
                id: 'create-channel-channel-type',
                aria_label: 'Channel type selection'
            },
            selectOptions: [
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
    ]
    let formObj = createForm(createChannelFormFormat);
    modalBody.appendChild(formObj);
    let createButton = document.createElement('button');
    createButton.setAttribute('class', 'btn btn-primary');
    createButton.textContent = "Create Channel";
    createButton.addEventListener('click', (e) => {
        let channelName = document.getElementById('create-channel-name-field').value;
        let channelDescription = document.getElementById('create-channel-description-field').value;
        let channelType = document.getElementById('create-channel-channel-type').value;
        let request = {
            name: channelName,
            description: channelDescription.trim().length > 0? channelDescription: '',
            private: channelType === 'private'?true:false
        }
        let createChannelRequest = apiCall('channel','POST',request);
        createChannelRequest.then( (response) => {
            refreshChannelList(`${response.channelId}`,myModal)
        });
    })
    modalFooter.prepend(createButton);
    myModal.show();
    console.log(modal.children);
})


var throttleTimer = false;
 
const handleInfiniteScroll = () => { //Infinite Scroll , Inspired from: https://webdesign.tutsplus.com/how-to-implement-infinite-scrolling-with-javascript--cms-37055t
    let spinner = document.getElementById('chatbox-spinner');
    let endOfPage = messageWindow.offsetHeight + messageWindow.scrollTop >= (messageWindow.scrollHeight);
    if (endOfPage && !throttleTimer) {
        throttleTimer = true;
        spinner.classList.remove('d-none');
        spinner.classList.add('d-flex');
        messageWindow.scrollTop = messageWindow.scrollTop + (messageWindow.scrollHeight - messageWindow.scrollTop);
        setTimeout( () => {
            getChannelMessages(mainPageStateObject.channelId,mainPageStateObject.userList,mainPageStateObject.startIndex).then( (e) => {
                spinner.classList.remove('d-flex');
                spinner.classList.add('d-none');
                throttleTimer = false;
            })
        },1000)
    }
  };
  
const removeInfiniteScroll = () => {
    messageWindow.removeEventListener("scroll", handleInfiniteScroll);
};
  

export const getChannelMessages = (channelId, memberDetails, messageStartIndex = 0) => {
    return new Promise( (resolve, reject) => {
        let spinner = document.getElementById('chatbox-spinner');
        let getChannelMessagesApi = apiCall(`message/${channelId}`,'GET',null,`start=${messageStartIndex}`);
        getChannelMessagesApi.then( (messageResponse) =>{
            if(messageResponse.messages.length > 0){
                mainPageStateObject.startIndex = messageStartIndex + messageResponse.messages.length;
                let index = messageStartIndex
                messageResponse.messages.forEach( (message) => {
                    let messageObject = {
                        sender: memberDetails[message.sender].name,
                        userimage: memberDetails[message.sender].image,
                        messageTime: `${convertDateToDDMMYY(message.sentAt)} ${getDateHHMM(message.sentAt)}`,
                        message: message.message,
                        image: message.image?message.image:null,
                        edited: message.edited,
                        editedAt: message.edited?`${convertDateToDDMMYY(message.editedAt)} ${getDateHHMM(message.editedAt)}`:null,
                        pinned: message.pinned,
                        reacts: message.reacts,
                        index
                    }
                    index+=1;
                    let chatBoxDiv = createMessage(messageObject);
                    messageWindow.insertBefore(chatBoxDiv,spinner);
                })
            } else {
                removeInfiniteScroll();
            } 
            resolve('')
        });
    })
}



document.getElementById('notification-button').addEventListener('click', (e) => {
    createMessage();
    console.log(messageWindow.scrollTop);
    console.log(`Element Scroll height is ${messageWindow.scrollHeight}`);
    console.log(`Element height + scroll is ${messageWindow.offsetHeight + messageWindow.scrollTop}`);
})
