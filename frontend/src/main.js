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
    convertDateToDDMMYY,
    getDateHHMM,
    getListOfUserDetails,
    channelDetailsSectionGenerator,
    getAllChannelMessages,
    createConfirmationModal,
    checkConnection
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
    }).catch((e) => {})
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

let messageWindow = document.getElementById('channel-messages');
let chatTextAreaDiv = document.getElementById('text-area-div');
let chatTextArea = document.getElementById('chat-input');


let fileInputLable = document.getElementById('file-input-label');
let fileInput = document.getElementById('file-input');
let fileDisplayerDiv = document.getElementById('file-displayer-div');
let fileInputCancelButton = document.getElementById('cancel-file-upload-button');
let sendMessageButton = document.getElementById('send-message-button');


//General Main Functions

let mainPageStateObject = { // State Object which is used to help us keep track of the infinity scroll, other than that also helps to pass around the channelId 
    currentIndex: 0,
    channelId: 0,
    userInChannel: false,
    endOfPage: false,
    userList:[]
}


const getChannelData = (channelListObject,userList) => { //Function that will trigger when a user visits a channel, sets up the channel messages, infinite scroll, and also the channel details
    removeInfiniteScroll();
    sendMessageButton.removeEventListener('click',sendMessageFunction);
    let channelId = channelListObject.id;
    let channelName = channelListObject.textContent.slice(1);
    let channelInputDiv = document.getElementById('channel-input-div');
    messageWindow.replaceChildren();
    let userInChannel = channelListObject.getAttribute('data-user-in-channel') === 'false'?false:true;
    getChannelDetails(channelId,channelName,userInChannel).then((userList) => {
        chatTextArea.value = '';
        mainPageStateObject = {
            currentIndex:0,
            channelId,
            userInChannel,
            endOfPage: false,
            userList
        }
        if(userInChannel){
            let loadingSpinnerDiv = document.createElement('div');
            loadingSpinnerDiv.setAttribute('class','d-none d-flex justify-content-center');
            loadingSpinnerDiv.setAttribute('id','chatbox-spinner');
            loadingSpinnerDiv.setAttribute('role','status');
            let loadingSpinner = document.createElement('div');
            loadingSpinner.setAttribute('class','spinner-border');
            loadingSpinnerDiv.appendChild(loadingSpinner);
            messageWindow.appendChild(loadingSpinnerDiv);
            getChannelMessages(channelId,false).then((r) => {
                messageWindow.addEventListener("scroll", handleInfiniteScroll);
                messageWindow.scrollTop = messageWindow.scrollHeight;
                if(chatTextArea.hasAttribute('disabled')){
                    chatTextArea.removeAttribute('disabled');
                    fileInput.removeAttribute('disabled');
                    fileInputLable.classList.remove('disabled');
                    sendMessageButton.removeAttribute('disabled');
                }
                sendMessageButton.addEventListener('click',sendMessageFunction);
            });
        } else {
            if(!chatTextArea.hasAttribute('disabled')){
                chatTextArea.setAttribute('disabled','');
                fileInput.setAttribute('disabled','');
                fileInputLable.classList.add('disabled');
                sendMessageButton.setAttribute('disabled','');
            }
        }
    })
}


//Channel List Section
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
        let userId = Number(localStorage.getItem('userId'));
        let publicChannelDiv = document.getElementById('channel-list-public');
        let privateChannelDiv = document.getElementById('channel-list-private');
        publicChannelDiv.replaceChildren();
        privateChannelDiv.replaceChildren();
        let channelResponse = apiCall('channel','GET');
        channelResponse.then( (response) => {
            let publicChannels = response.channels.filter((obj) => obj.private === false);
            let privateChannels = response.channels.filter((obj) => obj.private === true && obj.members.includes(userId));
            let publicChannelUl = createChannelListDiv(publicChannels);
            let privateChannelUl = createChannelListDiv(privateChannels);
            publicChannelDiv.appendChild(publicChannelUl);
            privateChannelDiv.appendChild(privateChannelUl);
            resolve('');
        }).catch((e) => {})
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

//Channel Message Section

const getSendMessageBody = () => {
    return new Promise( (resolve,reject) => {
        let messageBody = {}
        if (fileInput.files[0]) {
            fileToDataUrl(fileInput.files[0]).then((base64String) => {
                messageBody = {
                    image:base64String
                }
                resolve(messageBody);
            }).catch(e => {
                reject(e);
            })
        } else {
            if(chatTextArea.value.trim().length < 1){
                reject("Message cannot be empty");
            }
            messageBody = {
                message:chatTextArea.value
            }
            resolve(messageBody);
        }
    })
}

const sendMessageFunction = () => {
    getSendMessageBody().then( (messageBody) => {
        let sendMessageApi = apiCall(`message/${mainPageStateObject.channelId}`,'POST',messageBody).then((r) => {
            let members = mainPageStateObject.userList;
            mainPageStateObject.currentIndex+=1;
            let getLatestMessageInServer = apiCall(`message/${mainPageStateObject.channelId}`,'GET',null,`start=0`);
            getLatestMessageInServer.then((response) => {
                let message = response.messages[0];
                let messageObject = {
                    id: message.id,
                    senderId: message.sender,
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
                messageWindow.appendChild(chatBoxDiv);
                messageWindow.scrollTop = messageWindow.scrollHeight;
                messageObject.currentIndex+=1;
                if(!fileDisplayerDiv.classList.contains('d-none')){
                    fileDisplayerDiv.classList.add('d-none');
                }
                if(chatTextArea.hasAttribute('disabled')){
                    chatTextArea.removeAttribute('disabled')
                }
                fileInput.value = '';
                chatTextArea.value = '';

            }).catch ((e) => {});
        }).catch((e) => {});
    }).catch((e) => showWarningModal('Error', e))
}

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




fileInputLable.addEventListener('keypress',(e) => {
    if(e.key === "Enter" && !fileInput.hasAttribute('disabled')) {
        fileInput.click();
    }
})

fileInputCancelButton.addEventListener('click',(e) => {
    fileDisplayerDiv.classList.add('d-none');
    fileInput.value = '';
    chatTextArea.removeAttribute('disabled');
});


fileInput.addEventListener('change', (e) => {
    try {
        if(!chatTextArea.hasAttribute('disabled')){
            chatTextArea.setAttribute('disabled','')
        }
        fileToDataUrl(fileInput.files[0]).then((base64String) => {
            fileDisplayerDiv.children[1].replaceChildren();
            fileDisplayerDiv.classList.remove('d-none');
            let image = document.createElement('img');
            image.setAttribute('src',base64String);
            fileDisplayerDiv.children[1].appendChild(image);
        }).catch(e => {
            throw Error(e);
        })
    } catch (e) {
        showWarningModal('Error',e);
        fileInput.value = '';
    }
})


localStorage.setItem('token', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTQ0NiIsImlhdCI6MTY5NzM1NDg3NX0.ujbOdP_Zdc3AF-u3mQo0CH7hKIx_-cYXcADdSeF0C5A')
localStorage.setItem('userId', '99446');
// localStorage.setItem('token', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNTI3MiIsImlhdCI6MTY5Nzc5NTUyOX0.kIvq16DBbFCbUcVO9a7aWMRDoqnPra2qjOlEaQ1sl6g')
// localStorage.setItem('userId', '15272');


//Infinity Scroll Section
var throttleTimer = false;

const handleInfiniteScroll = () => { //Infinite Scroll , Inspired from: https://webdesign.tutsplus.com/how-to-implement-infinite-scrolling-with-javascript--cms-37055t
    let spinner = document.getElementById('chatbox-spinner');
    let startOfPage = messageWindow.scrollTop === 0;
    let userList = mainPageStateObject.userList;
    if (!throttleTimer && startOfPage) {
        let previousScrollHeight = messageWindow.scrollHeight;
        throttleTimer = true;
        spinner.classList.remove('d-none');
        spinner.classList.add('d-flex');
        setTimeout( () => {
            if (startOfPage) {
                getChannelMessages(mainPageStateObject.channelId).then((response) => {
                    if (mainPageStateObject.currentIndex === -1) {
                        removeInfiniteScroll();
                    }
                    messageWindow.scrollTop = messageWindow.scrollHeight - previousScrollHeight - 100;
                }).catch(() => {
                    removeInfiniteScroll();
                }).finally(() =>{
                    spinner.classList.remove('d-flex');
                    spinner.classList.add('d-none');
                    throttleTimer = false;
                } )
            }
        },1000)
    }
  };
  
const removeInfiniteScroll = () => {
    messageWindow.removeEventListener("scroll", handleInfiniteScroll);
};
  

export const getChannelMessages = (channelId, beforeScroll = true) => {
    return new Promise( (resolve,reject) => {
        let memberDetails = mainPageStateObject.userList;
        let getMessageApi = apiCall(`message/${channelId}`,'GET',null,`start=${mainPageStateObject.currentIndex}`);
        getMessageApi.then((response) => {
            if(response.messages.length > 0) {
                mainPageStateObject.currentIndex += response.messages.length;
                let messagesList = beforeScroll?response.messages:response.messages.reverse();
                messagesList.forEach((message) => {
                    let messageObject = {
                        id: message.id,
                        senderId: message.sender,
                        sender: memberDetails[message.sender].name,
                        userimage: memberDetails[message.sender].image,
                        messageTime: `${convertDateToDDMMYY(message.sentAt)} ${getDateHHMM(message.sentAt)}`,
                        message: message.message,
                        image: message.image?message.image:null,
                        edited: message.edited,
                        editedAt: message.edited?`${convertDateToDDMMYY(message.editedAt)} ${getDateHHMM(message.editedAt)}`:null,
                        pinned: message.pinned,
                        reacts: message.reacts,
                    }
                    let chatBoxDiv = createMessage(messageObject);
                    if(beforeScroll){
                        messageWindow.insertBefore(chatBoxDiv,messageWindow.children[1]);
                    } else {
                        messageWindow.appendChild(chatBoxDiv);
                    }
                })
            } else {
                mainPageStateObject.currentIndex = -1;
            }
            resolve('');
        }).catch((e) => reject(e));
    })
}

const emojiHandler = (emojiButton, emojiString, channelId, messageId) => {
    let reactApiBody = {
        react:emojiString
    }
    let userId = Number(localStorage.getItem('userId'));
    let currentLength = Number(emojiButton.textContent.split(' ')[1]);

    if(emojiButton.classList.contains('btn-light')){
        let reactApiCall = apiCall(`message/react/${channelId}/${messageId}`,'POST',reactApiBody);
        reactApiCall.then((response) => {
            emojiButton.classList.remove('btn-light');
            emojiButton.classList.add('btn-primary');
            emojiButton.textContent = `${String.fromCodePoint(Number(emojiString))} ${currentLength+1}`;
        
        }).catch((e) => {})
    } else {
        let unReactApiCall = apiCall(`message/unreact/${channelId}/${messageId}`,'POST',reactApiBody);
        unReactApiCall.then((response) => {
            emojiButton.classList.remove('btn-primary');
            emojiButton.classList.add('btn-light');
            emojiButton.textContent = `${String.fromCodePoint(Number(emojiString))} ${currentLength-1}`;
        }).catch((e) => {})
    }
}


const createMessage = (messageObj,disableButtons = false) => {
    let channelId = mainPageStateObject.channelId;
    let userId = Number(localStorage.getItem('userId'));
    let chatBoxDiv = document.createElement('div');
    chatBoxDiv.setAttribute('class','message-chatbox d-flex flex-row flex-wrap border-top border-bottom border-dark px-2');
    chatBoxDiv.setAttribute('data-id', messageObj.id);

    let messagePictureSection = document.createElement('div');
    messagePictureSection.setAttribute('class','message-user-picture-section');

    let userProfilePictureDiv = document.createElement('div');
    userProfilePictureDiv.setAttribute('class','message-user-picture rounded-circle m-1 border border-dark');
    messagePictureSection.appendChild(userProfilePictureDiv);

    let messageContentSectionDiv = document.createElement('div');
    messageContentSectionDiv.setAttribute('class','message-content-section d-flex flex-column');
    
    let messageHeaderSection = document.createElement('div');
    messageHeaderSection.setAttribute('class','pb-2 d-flex flex-row d-flex justify-content-between border-bottom border-dark-subtle text-wrap');
    messageContentSectionDiv.appendChild(messageHeaderSection);


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
        imageDiv.style.backgroundImage = `url(${messageObj.image})`;
        messageContentSection.appendChild(imageDiv);
    } else {
        let bodyText = document.createElement('p');
        bodyText.setAttribute('class','fs-6');
        bodyText.textContent = messageObj.message;
        messageContentSection.appendChild(bodyText);
    }

    messageContentSectionDiv.appendChild(messageContentSection);

    let messageEditedDiv= document.createElement('div');
    messageEditedDiv.setAttribute('class','w-100 text-wrap border-top border-dark-subtle d-flex flex-row d-flex');

    if(messageObj.edited){
        let editedText = document.createElement('p');
        editedText.setAttribute('class','mb-0');
        editedText.textContent = `Edited at ${messageObj.editedAt}`
        messageEditedDiv.appendChild(editedText);
    }

    let buttonsDiv = document.createElement('div');
    buttonsDiv.setAttribute('class','w-100 text-wrap py-0 d-flex flex-row d-flex justify-content-between border-bottom border-dark-subtle');

    let leftSideButtonDiv = document.createElement('div');
    let pinButton = document.createElement('button');
    pinButton.setAttribute('class',`btn ${messageObj.pinned?'btn-primary':'btn-light'} border border-dark emoji-button p-1`);
    let pinButtonIcon = document.createElement('i');
    pinButtonIcon.setAttribute('class','bi bi-pin-angle');
    pinButton.appendChild(pinButtonIcon);
    pinButton.addEventListener('click',(e) => {
        if(pinButton.classList.contains('btn-light')){
            let pinApiCall = apiCall(`message/pin/${channelId}/${messageObj.id}`,'POST');
            pinApiCall.then((response) => {
                pinButton.classList.remove('btn-light');
                pinButton.classList.add('btn-primary');
            }).catch((e) => {});
        } else {
            let unPinApiCall = apiCall(`message/unpin/${channelId}/${messageObj.id}`,'POST');
            unPinApiCall.then((response) => {
                pinButton.classList.remove('btn-primary');
                pinButton.classList.add('btn-light');
            }).catch((e) => {});
        }
    })

    leftSideButtonDiv.appendChild(pinButton);

    if(userId === messageObj.senderId) {
        let editButton = document.createElement('button');
        editButton.setAttribute('class','btn btn-link mb-0 p-0');
        editButton.textContent = "Edit";
        
        let deleteButton = document.createElement('button')
        deleteButton.setAttribute('class','btn btn-danger border border-dark emoji-button p-1 me-1');
        let deleteButtonIcon = document.createElement('i');
        deleteButtonIcon.setAttribute('class','bi bi-trash');

        if(disableButtons) {
            editButton.setAttribute('disabled','');
            deleteButton.setAttribute('disabled','');
        }

        deleteButton.appendChild(deleteButtonIcon);
        deleteButton.addEventListener('click',(e) => {
            let deleteMessageModalBase = createConfirmationModal('Warning','Are you sure you want to delete this message');
            let deleteMessageModal = new bootstrap.Modal(deleteMessageModalBase);
            let deleteMessageConfirmationButton = deleteMessageModalBase.children[0].children[0].children[2].children[0];
            deleteMessageConfirmationButton.addEventListener('click', (e) => {
                apiCall(`message/${channelId}/${messageObj.id}`,'DELETE').then((r) => {
                    mainPageStateObject.currentIndex -=1;
                    deleteMessageModal.hide();
                    chatBoxDiv.remove();
                }).catch((e) => {})
            })
            deleteMessageModal.show();
        })

        leftSideButtonDiv.appendChild(deleteButton);
        if(!messageObj.edited){
            messageEditedDiv.appendChild(editButton);
        }
    }




    let emoji1 = messageObj.reacts.filter((reactObj) => reactObj.react === '128515');
    let emoji2 = messageObj.reacts.filter((reactObj) => reactObj.react === '128514');
    let emoji3 = messageObj.reacts.filter((reactObj) => reactObj.react === '128517');

    let emoji1UserHasReact = emoji1.filter((reactObj) => reactObj.user === userId).length > 0 ? true : false;
    let emoji2UserHasReact = emoji2.filter((reactObj) => reactObj.user === userId).length > 0 ? true : false;
    let emoji3UserHasReact = emoji3.filter((reactObj) => reactObj.user === userId).length > 0 ? true : false;

    let reactionsDiv = document.createElement('div');
    reactionsDiv.setAttribute('class','d-flex gap-1 flex-row');

    let emojiButton1 = document.createElement('button')
    emojiButton1.setAttribute('class',`btn ${emoji1UserHasReact?'btn-primary':'btn-light'} border border-dark emoji-button p-1`);
    emojiButton1.textContent = `${String.fromCodePoint(128515)} ${emoji1.length}`;

    let emojiButton2 = document.createElement('button')
    emojiButton2.setAttribute('class',`btn ${emoji2UserHasReact?'btn-primary':'btn-light'} border border-dark emoji-button p-1`);
    emojiButton2.textContent = `${String.fromCodePoint(128514)} ${emoji2.length}`;

    let emojiButton3 = document.createElement('button')
    emojiButton3.setAttribute('class',`btn ${emoji3UserHasReact?'btn-primary':'btn-light'} border border-dark emoji-button p-1`);
    emojiButton3.textContent = `${String.fromCodePoint(128517)} ${emoji3.length}`; 

    emojiButton1.addEventListener('click', (e) => {
        emojiHandler(emojiButton1,'128515',channelId, messageObj.id);
    });

    emojiButton2.addEventListener('click', (e) => {
        emojiHandler(emojiButton2,'128514',channelId, messageObj.id);
    });

    emojiButton3.addEventListener('click', (e) => {
        emojiHandler(emojiButton3,'128517',channelId, messageObj.id);
    });

    
    if(disableButtons){
        pinButton.setAttribute('disabled','');
        emojiButton1.setAttribute('disabled','');
        emojiButton2.setAttribute('disabled','');
        emojiButton3.setAttribute('disabled','');
    }
    
    buttonsDiv.appendChild(leftSideButtonDiv);
    buttonsDiv.appendChild(reactionsDiv);

    messageHeaderSection.appendChild(messageSenderName);
    messageHeaderSection.appendChild(messageSendTime);  

    reactionsDiv.appendChild(emojiButton1);
    reactionsDiv.appendChild(emojiButton2);
    reactionsDiv.appendChild(emojiButton3);
    

    chatBoxDiv.appendChild(messagePictureSection);
    chatBoxDiv.appendChild(messageContentSectionDiv);
    chatBoxDiv.appendChild(messageEditedDiv);
    chatBoxDiv.appendChild(buttonsDiv);

    return chatBoxDiv;
}











//Channel Details Section

const getChannelDetails = (channelId, channelName, userInChannel) => {
    return new Promise( (resolve, reject) => {
        let channelPageDiv = document.getElementById('channel-page-section');
        channelPageDiv.replaceChildren();
        let channelNameHeading = document.createElement('h5');
        channelNameHeading.textContent = channelName;
        channelNameHeading.setAttribute('class','text-wrap')
        channelPageDiv.appendChild(channelNameHeading);
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
                }).catch((e) => {})
            })  
            resolve(null);
        } else {
            let channelInformation =  apiCall(`channel/${channelId}`,'GET');
            channelInformation.then( (response) => {
                getListOfUserDetails(response.members).then((members) => {
                    let editChannelButton = document.createElement('button');
                    editChannelButton.setAttribute('class', 'btn btn-light border-dark-subtle  mb-2 me-md-2');
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
                            
                        }).catch((e) => {})
                    })

                    editChannelModalFooter.prepend(editChannelModalEditButton);

                    let leaveChannelButton = document.createElement('button');
                    leaveChannelButton.setAttribute('class', 'btn btn-danger mb-2 me-md-2');
                    leaveChannelButton.textContent = 'Leave Channel';
                    leaveChannelButton.setAttribute('aria-label','Leave Channel Button');

                    let leaveChannelModalBase = createConfirmationModal('Warning','Are you sure you want to leave this channel',)
                    let leaveChannelModal = new bootstrap.Modal(leaveChannelModalBase);


                    leaveChannelButton.addEventListener('click', (e) => {
                        leaveChannelModal.show();
                    })

                    let leaveChannelConfirmationButton = leaveChannelModalBase.children[0].children[0].children[2].children[0];
                    leaveChannelConfirmationButton.addEventListener('click', (e) => {
                        let leaveChannelApiRequest = apiCall(`channel/${channelId}/leave`,'POST');
                        leaveChannelApiRequest.then( (leaveResponse) => {
                            if (!leaveResponse.error){
                                refreshChannelList(channelId,leaveChannelModal);
                            }
                        }).catch((e) => {})
                    })

                    let pinnedMessageButton = document.createElement('button');
                    pinnedMessageButton.setAttribute('class', 'btn btn-light border border-dark me-md-2 mb-2');
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
                    pinnedMessageModalBase.addEventListener('shown.bs.modal', (e) => {
                        pinnedMessageModalBody.scrollTop = pinnedMessageModalBody.scrollHeight;
                    })

                    pinnedMessageButton.addEventListener('click', (e) => {
                        pinnedMessagesDiv.replaceChildren();
                        getAllChannelMessages(channelId).then((messages) => {
                            messages = messages.filter((message) => message.pinned === true );
                            messages.reverse().forEach((message) => {
                                let messageObject = {
                                    id: message.id,
                                    senderId: message.sender,
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
                                let chatBoxDiv = createMessage(messageObject, true);
                                pinnedMessagesDiv.appendChild(chatBoxDiv);
                            })
                            pinnedMessageModalBody.appendChild(pinnedMessagesDiv);
             
                            pinnedMessageModal.show();
                        })
                    })
                    let inviteToChannelButton = document.createElement('button');
                    inviteToChannelButton.setAttribute('class', 'btn btn-light border border-dark mb-2');
                    inviteToChannelButton.textContent = 'Invite People';
                    inviteToChannelButton.setAttribute('aria-label','Invite PeopleButton');



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
                    channelPageDiv.appendChild(pinnedMessageButton);
                    channelPageDiv.appendChild(inviteToChannelButton);
                    channelPageDiv.appendChild(leaveChannelButton);
                    channelPageDiv.appendChild(channelType);
                    channelPageDiv.appendChild(channelCreator);
                    channelPageDiv.appendChild(channelCreationDate);
                    channelPageDiv.appendChild(channelDescription);
                    channelPageDiv.appendChild(channelMembersText);
                    channelPageDiv.appendChild(ulObject);
                    resolve(members);
                }).catch((e) => {})
            }).catch((e) => {})
        }
    })
}




//Create Channel Section

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
        }).catch((e) => {});
    })
    modalFooter.prepend(createButton);
    myModal.show();

})




document.getElementById('notification-button').addEventListener('click', (e) => {
    // createMessage();
    // console.log(`Element Scroll height is ${messageWindow.scrollHeight}`);
    // console.log(`Element Offset height is ${messageWindow.offsetHeight}`);
    // console.log(`Element Scroll Top is ${messageWindow.scrollTop}`);
    // console.log(`Element height + scroll is ${messageWindow.offsetHeight + messageWindow.scrollTop}`);
    checkConnection();
})
