// A helper you may want to use when uploading new images to the server.
import { 
    fileToDataUrl, 
    showMessageModal,
    movePage,checkEmail, 
    formInputElementValidator, 
    emptyInputValidator,
    apiCall, 
    createBasicModalStructure, 
    createForm, 
    convertDateToDDMMYY,
    getDateHHMM,
    getObjectOfUserDetails,
    channelDetailsSectionGenerator,
    getAllChannelMessages,
    getSpecificChannelname,
    createConfirmationModal,
    inviteMultipleUsers
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
    return !emptyInputValidator(registerPageNameInput,registerNameWarningDiv,"Name");
}

registerPageNameInput.addEventListener('blur', (e) => {
    validateRegisterPageNameInput();
})


let registerPageEmailInput = document.getElementById('register-email-input');

const validateRegisterPageEmailInput = () => {
    let valid = true;
    let registerEmailWarningDiv = document.getElementById('register-email-invalid-message');
    let isEmpty = emptyInputValidator(registerPageEmailInput,registerEmailWarningDiv,"Email");
    if(!isEmpty) {
        let emailIsValid = checkEmail(registerPageEmailInput.value);
        if (!emailIsValid) {
            registerEmailWarningDiv.textContent = "Wrong Email Format";
            valid = false;
        }
        formInputElementValidator(registerPageEmailInput, emailIsValid);
    } else {
        valid = false;
    }
    return valid;
}

registerPageEmailInput.addEventListener('blur', (e) => {
    validateRegisterPageEmailInput();
})

let registerPagePasswordInput = document.getElementById('register-password-input');
let registerPageConfirmPasswordInput = document.getElementById('register-confirm-password-input');

const validateRegisterPagePasswordInput = () => {
    let registerPasswordWarningDiv = document.getElementById('register-password-invalid-message');
    let errorMessage = '';
    let valid = true;
    if(registerPagePasswordInput.value.length === 0 || registerPageConfirmPasswordInput.value.length === 0){
        errorMessage = `${registerPagePasswordInput.value.length === 0?'Password':'Confirm Password'} field cannot be empty`
        valid = false;
    } else {
        if(registerPagePasswordInput.value === registerPageConfirmPasswordInput.value) {
            valid = true;
        } else {
            valid = false;
            errorMessage = 'Password must be the same';
        }
    }
    if(!valid){
        registerPasswordWarningDiv.textContent = errorMessage
    }
    formInputElementValidator(registerPagePasswordInput, valid);
    formInputElementValidator(registerPageConfirmPasswordInput, valid);
    return [valid,errorMessage];
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
    try{
        e.preventDefault();
        registerPageButton.disabled = true;
        if(!validateRegisterPageNameInput()){
            throw new Error('Please fix the Name Field')
        }
        if(!validateRegisterPageEmailInput()){
            throw new Error('Please fix the Email Field')
        }
        let [passwordValid,passwordErrorMessage] = validateRegisterPagePasswordInput();
        if(!passwordValid){
            throw new Error(passwordErrorMessage);
        } 
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
        }).catch( (e) => {
            registerPageButton.disabled = false;
        })
    } catch(e){
        registerPageButton.disabled = false;
        showMessageModal('Error', e.message)
    }
})



/*
Main Page Code
*/
let openButton = document.getElementById('open-button');
let channelBar = document.getElementById('channel-list-sidebar');

let profileButton = document.getElementById('profile-button');
let notificationButton = document.getElementById('profile-button');

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


let loadProfilePicture = () => {
    let userId = localStorage.getItem('userId');
    getObjectOfUserDetails([userId]).then((userObj) => {
        let profilePicture = `url(${userObj[userId].image?userObj[userId].image:'../assets/user.svg'})`;
        profileButton.style.backgroundImage = profilePicture;
    })
}

const getChannelData = (channelId) => { //Function that will trigger when a user visits a channel, sets up the channel messages, infinite scroll, and also the channel details
    // let channelName = channelListObject.textContent.slice(1);
    let channelInputDiv = document.getElementById('channel-input-div');
    getSpecificChannelname(channelId).then((channelName) => {
        getChannelDetails(channelId,channelName).then(([userList,userInChannel]) => {
            mainPageStateObject = {
                currentIndex:0,
                channelId,
                userInChannel,
                endOfPage: false,
                userList
            }
            removeInfiniteScroll();
            sendMessageButton.removeEventListener('click',sendMessageFunction);
            messageWindow.replaceChildren();
            chatTextArea.value = '';
            console.log(`user in channel is ${userInChannel}`);
            console.log(mainPageStateObject.currentIndex);
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
                    if(mainPageStateObject.currentIndex !== -1){
                        messageWindow.addEventListener("scroll", handleInfiniteScroll);
                        messageWindow.scrollTop = messageWindow.scrollHeight;
                    }
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
    })
}

//Navbar Section

const profileSectionGenerator = (userId,edittable = false) => {
    return new Promise((resolve,reject) => {
        let profileModalBase = createBasicModalStructure();
        let profileModal = new bootstrap.Modal(profileModalBase);
        let profileModalHeader = profileModalBase.children[0].children[0].children[0];
        let profileModalBody = profileModalBase.children[0].children[0].children[1];
        let profileModalFooter = profileModalBase.children[0].children[0].children[2];
        let profileBaseDiv = document.createElement('div');
        profileBaseDiv.setAttribute('class','w-100 pt-1 d-flex flex-column gap-2');
        let profileImageDiv = document.createElement('div');
        profileImageDiv.setAttribute('class','rounded-circle profile-menu-image border border-dark-subtle background-image-cover align-self-center')
        getObjectOfUserDetails([userId]).then((userObj) => {
            let initialUserImage = `url(${userObj[userId].image?userObj[userId].image:'../assets/user.svg'})`;
            profileImageDiv.style.backgroundImage = initialUserImage;
            profileBaseDiv.appendChild(profileImageDiv);
            if(edittable){
                profileModalHeader.children[0].textContent = 'Edit Profile';
                let editProfileFormFormat = [
                    {
                        type: 'input',
                        name: 'Username',
                        value: userObj[userId].name,
                        attributes: {
                            type: 'text',
                            class: 'form-control mb-2',
                            id: 'edit-profile-name-field',
                            autocomplete: 'username'
                        }
                    },
                    {
                        type: 'input',
                        name: 'Email',
                        value: userObj[userId].email,
                        attributes: {
                            type: 'text',
                            class: 'form-control mb-2',
                            id: 'edit-profile-email-field',
                            autocomplete: 'email'
                        }
                    },
                    {
                        type: 'textarea',
                        name: 'Bio',
                        value: userObj[userId].bio,
                        attributes: {
                            class: 'form-control mb-2 h-100 overflow-y-scroll text-wrap',
                            id: 'edit-profile-bio-field'
                        }
                    },
                    {
                        type: 'input',
                        name: 'Profile Picture',
                        attributes: {
                            type: 'file',
                            class: 'form-control mb-2 h-100',
                            id: 'edit-profile-profile-picture-input'
                        }
                    }
                ]



                let editProfileForm = createForm(editProfileFormFormat);

                let resetPictureButton = document.createElement('button');
                resetPictureButton.setAttribute('class','btn btn-primary mb-3 d-block');
                resetPictureButton.textContent = 'Reset Picture';

                let editProfileFileInput = editProfileForm.children[7];

                editProfileFileInput.addEventListener('change', (e) => {
                    try {
                        fileToDataUrl(editProfileFileInput.files[0]).then((base64String) => {
                            profileImageDiv.style.backgroundImage = `url(${base64String})`;
                        }).catch(e => {
                            throw Error(e);
                        })
                    } catch (e) {
                        showMessageModal('Error',e);
                        editProfileFileInput.value = '';
                    }
                })

                resetPictureButton.addEventListener('click',(e) => {
                    e.preventDefault();
                    editProfileFileInput.value = '';
                    profileImageDiv.style.backgroundImage = initialUserImage;
                })
                

                editProfileForm.appendChild(resetPictureButton)

                let passwordLabel = document.createElement('label');
                passwordLabel.setAttribute('for','edit-profile-new-password');
                passwordLabel.setAttribute('class','form-label fs-6');
                passwordLabel.textContent = 'New Password';


                let passwordFieldDiv = document.createElement('div');
                passwordFieldDiv.setAttribute('class','input-group mb-2')
                let passwordInput = document.createElement('input');
                passwordInput.setAttribute('type','password');
                passwordInput.setAttribute('class','form-control');
                passwordInput.setAttribute('placeholder','*********');
                passwordInput.setAttribute('id','edit-profile-new-password');
                passwordInput.setAttribute('autocomplete','new-password');
                let showPasswordButton = document.createElement('button');
                let showPasswordButtonIcon = document.createElement('i');
                showPasswordButtonIcon.setAttribute('class','bi bi-eye-fill')
                showPasswordButton.setAttribute('class','btn btn-outline-secondary p-2 fs-4');
                showPasswordButton.appendChild(showPasswordButtonIcon);
                showPasswordButton.setAttribute('aria-label','Show or Hide New Password Button');
                showPasswordButton.addEventListener('click',(e) => {
                    e.preventDefault();
                    if(passwordInput.getAttribute('type') === 'password'){
                        passwordInput.setAttribute('type', 'text');
                        showPasswordButtonIcon.classList.remove('bi-eye-fill');
                        showPasswordButtonIcon.classList.add('bi-eye-slash');
                        passwordInput.setAttribute('placeholder','');
                    } else {
                        passwordInput.setAttribute('type', 'password');
                        showPasswordButtonIcon.classList.remove('bi-eye-slash');
                        showPasswordButtonIcon.classList.add('bi-eye-fill');
                        passwordInput.setAttribute('placeholder','*********');
                    }
                })


                passwordFieldDiv.appendChild(passwordInput);
                passwordFieldDiv.appendChild(showPasswordButton);
                editProfileForm.appendChild(passwordLabel);
                editProfileForm.appendChild(passwordFieldDiv);
                profileBaseDiv.appendChild(editProfileForm);

                let editProfileEditButton = document.createElement('button');
                editProfileEditButton.setAttribute('class','btn btn-light border border-dark');
                editProfileEditButton.textContent = 'Edit Profile';

                editProfileEditButton.addEventListener('click', (e) => {
                    let editedName = document.getElementById('edit-profile-name-field').value;
                    let editedEmail = document.getElementById('edit-profile-email-field').value;
                    let editedBio = document.getElementById('edit-profile-bio-field').value;
                    if(!checkEmail(editedEmail)){
                        showMessageModal('Error', 'Invalid Email Format');
                    } else {
                        let editedPassword = passwordInput.value;
                        let editProfileBody = {
                            ...((editedName.trim().length > 0 && editedName.trim() !== userObj[userId].name ) && {name:editedName}),
                            ...((editedEmail.trim().length > 0 && editedEmail.trim() !== userObj[userId].email ) && {email:editedEmail}),
                            ...((editedBio.trim().length > 0 && editedBio.trim() !== userObj[userId].bio ) && {bio:editedBio}),
                            ...((editedPassword.trim().length > 0) && {password:editedPassword})
                        }
                        console.log(userObj[userId].email)
                        fileToDataUrl(editProfileFileInput.files[0]?editProfileFileInput.files[0]:null).then((base64String) => {
                            if(base64String !== null){
                                editProfileBody['image'] = base64String;
                            }
                            console.log(editProfileBody);
                            apiCall('user','PUT',editProfileBody).then((r) => {
                                loadProfilePicture();
                                profileModal.hide();
                            }).catch((e) => {})
                        }).catch(e => {
                            reject(e);
                        })
                    }
                })

                profileModalFooter.prepend(editProfileEditButton);
            } else {
                profileModalHeader.children[0].textContent = `${userObj[userId].name} Profile`;
                let profileElementsToCreate = [
                    {
                        fieldName: 'Name:',
                        value: userObj[userId].name,
                        id: 'view-profile-name'
                    },
                    {
                        fieldName: 'Email:',
                        value: userObj[userId].email,
                        id: 'view-profile-email'
                    },
                    {
                        fieldName: 'Bio:',
                        value: userObj[userId].bio,
                        id: 'view-profile-bio'
                    }
                ]
                profileElementsToCreate.forEach((e) => {
                    let textLabel = document.createElement('label');
                    console.log(e.id);
                    textLabel.setAttribute('for',e.id);
                    textLabel.setAttribute('class','form-label fs-6');
                    textLabel.textContent = e.fieldName;
                    let textParagraphElement = document.createElement('p');
                    textParagraphElement.setAttribute('id',e.id);
                    textParagraphElement.setAttribute('class','fs-4 text-wrap mb-2')
                    textParagraphElement.textContent = e.value;
                    profileBaseDiv.appendChild(textLabel);
                    profileBaseDiv.appendChild(textParagraphElement);
                })     
            }
            profileModalBody.appendChild(profileBaseDiv);
            resolve(profileModal);
        })
    })
  
    
}



profileButton.addEventListener('click', (e) => {
    let profileMenuSectionModalBase = createBasicModalStructure('modal-lg',false,false,false);
    let profileMenuSectionModal = new bootstrap.Modal(profileMenuSectionModalBase);
    let editProfileButton = document.createElement('button');
    let profileMenuUserImage = document.createElement('div');
    profileMenuUserImage.setAttribute('class','rounded-circle profile-menu-image border border-dark-subtle background-image-cover align-self-center')
    editProfileButton.textContent = 'Edit Profile'
    profileMenuUserImage.style.backgroundImage = window.getComputedStyle(profileButton).backgroundImage;

    let profileMenuSectionDiv = document.createElement('div');
    profileMenuSectionDiv.setAttribute('class','w-100 pt-1 d-flex flex-column gap-2')
    editProfileButton.setAttribute('class','btn btn-light border border-dark')


    editProfileButton.addEventListener('click', (e) => {
        let currentUserId = localStorage.getItem('userId');
        profileSectionGenerator(currentUserId,true).then((profileModal) => {
            profileMenuSectionModal.hide();
            profileModal.show();
        });
        
    })


    let logOutButton = document.createElement('button');
    logOutButton.setAttribute('class','btn btn-light border border-dark')
    logOutButton.textContent = 'Logout'

    logOutButton.addEventListener('click', (e) => {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        movePage('main-page','login-page');
        profileMenuSectionModal.hide();
    })

    profileMenuSectionDiv.appendChild(profileMenuUserImage);
    profileMenuSectionDiv.appendChild(editProfileButton);
    profileMenuSectionDiv.appendChild(logOutButton);

    profileMenuSectionModalBase.children[0].children[0].children[0].appendChild(profileMenuSectionDiv);

    profileMenuSectionModal.show();
})



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
        liObj.style.listStyle = 'none';
        liObj.appendChild(aObj);
        ulListObject.appendChild(liObj);
        liObj.addEventListener('click', (e) => {
            getChannelData(channel.id);
        })
    })
    return ulListObject;

}

const getAllChannels = (populateNotificationChannelList = false) => {
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
        getChannelData(channelId);
        if(modalObject !== null){
            modalObject.hide();
        }
    })
}

//Channel Message Section

const getCreateOrEditMessageRequest = (fileInputElement,textArea, previousTextValue = null) => {
    return new Promise( (resolve,reject) => {
        let messageBody = {}
        if (fileInputElement.files[0]) {
            fileToDataUrl(fileInputElement.files[0]).then((base64String) => {
                messageBody = {
                    image:base64String
                }
                resolve(messageBody);
            }).catch(e => {
                reject(e);
            })
        } else {
            if(textArea.value.trim().length < 1){
                reject('Message cannot be empty');
            }
            if(previousTextValue !== null){
                if(textArea.value.trim() === previousTextValue){
                    reject('Cannot send the same exact message')
                }
            }
            messageBody = {
                message:textArea.value
            }
            resolve(messageBody);
        }
    })
}

const sendMessageFunction = () => {
    getCreateOrEditMessageRequest(fileInput,chatTextArea).then( (messageBody) => {
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
                    userImage: members[message.sender].image,
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
    }).catch((e) => showMessageModal('Error', e))
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
        showMessageModal('Error',e);
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
                        showMessageModal('Notice','No More Message to Be Loaded');
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
        console.log(memberDetails);
        console.log(`Index before call is ${mainPageStateObject.currentIndex}`);
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
                        userImage: memberDetails[message.sender].image,
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

const createEdittedSection = (timeString) => {
    let editedText = document.createElement('p');
    editedText.setAttribute('class','mb-0');
    editedText.textContent = `Edited at ${timeString}`;
    return editedText;
}

const generateBodySection = (textMessage, image = null) => {
    if(image !== null){
        let imageDiv = document.createElement('div');
        imageDiv.setAttribute('class','image-content background-image-contain');
        imageDiv.style.backgroundImage = `url(${image})`;
        return imageDiv;
    } else {
        let bodyText = document.createElement('p');
        bodyText.setAttribute('class','fs-6');
        bodyText.textContent = textMessage;
        return bodyText;
    }
}


const openImageModal = (messageId) => {
    let imageModalBase = createBasicModalStructure('modal-xl',false);
    let imageModal = new bootstrap.Modal(imageModalBase);
    imageModalBase.children[0].classList.add('p-2');
    let imageModalHeader = imageModalBase.children[0].children[0].children[0];

    let imageModalDiv = document.createElement('div');
    imageModalDiv.setAttribute('class','d-flex flex-row align-items-center gap-1 py-1 h-100');
    let previousButton = document.createElement('button');
    let nextButton = document.createElement('button');
    previousButton.setAttribute('class','btn btn-light border border-dark h-10');
    nextButton.setAttribute('class','btn btn-light border border-dark h-10');
    let previousIcon = document.createElement('i');
    let nextIcon = document.createElement('i');
    previousIcon.setAttribute('class','bi bi-arrow-left fs-5');
    nextIcon.setAttribute('class','bi bi-arrow-right fs-5');
    previousButton.setAttribute('aria-label','Previous Image Button');
    nextButton.setAttribute('aria-label','Next Image Button');
    previousButton.appendChild(previousIcon);
    nextButton.appendChild(nextIcon);
    let imageModalImageDiv = document.createElement('div');
    imageModalImageDiv.setAttribute('class','w-100 flex-grow-1 w-100 d-flex flex-row justify-content-center');
    imageModalDiv.appendChild(previousButton);
    imageModalDiv.appendChild(imageModalImageDiv);
    imageModalDiv.appendChild(nextButton);
    imageModalBase.children[0].children[0].children[1].appendChild(imageModalDiv);
    imageModalBase.children[0].children[0].children[1].classList.add('px-0')
    let imageModalImage = document.createElement('img');
    imageModalImageDiv.appendChild(imageModalImage);
    imageModalImage.setAttribute('class','mw-100 mh-100');
    getAllChannelMessages(mainPageStateObject.channelId).then((messages) => {
        let messageWithImages = messages.filter((message) => message.image).reverse();
        let maxImageIndex = messageWithImages.length - 1;
        let currentImageIndex = messageWithImages.findIndex((message) => message.id == messageId);
        imageModalHeader.children[0].textContent = `Viewing Image ${currentImageIndex} out of ${maxImageIndex} Images`;
        if(currentImageIndex === 0){
            previousButton.setAttribute('disabled','');
        }
        if(currentImageIndex === maxImageIndex) {
            nextButton.setAttribute('disabled', '');
        }
        imageModalImage.setAttribute('src',messageWithImages[currentImageIndex].image);


        let imageModalButtonHandler = (action) => {
            if(action === 'next'){
                currentImageIndex+=1;
            } else if(action === 'prev') {
                currentImageIndex-=1;
            }
            imageModalImage.setAttribute('src',messageWithImages[currentImageIndex].image);
            imageModalHeader.children[0].textContent = `Viewing Image ${currentImageIndex} out of ${maxImageIndex} Images`;
            if(currentImageIndex === 0){
                previousButton.setAttribute('disabled','');
            }
            if(currentImageIndex === maxImageIndex) {
                nextButton.setAttribute('disabled', '');
            }
            if(currentImageIndex > 0 && currentImageIndex <= maxImageIndex){
                previousButton.removeAttribute('disabled');
            }
            if(currentImageIndex >= 0 && currentImageIndex < maxImageIndex){
                nextButton.removeAttribute('disabled');
            }
        }

        nextButton.addEventListener('click', (e) => {
            imageModalButtonHandler('next');
        })

        previousButton.addEventListener('click', (e) => {
            imageModalButtonHandler('prev');
        })

    })
    imageModal.show();
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
    userProfilePictureDiv.setAttribute('class','default-profile-image w-80 background-image-cover rounded-circle m-1 border border-dark');
    messagePictureSection.appendChild(userProfilePictureDiv);
    if(messageObj.userImage) {
        userProfilePictureDiv.style.backgroundImage = `url(${messageObj.userImage})`;
    }

    let messageContentSectionDiv = document.createElement('div');
    messageContentSectionDiv.setAttribute('class','message-content-section d-flex flex-column');
    
    let messageHeaderSection = document.createElement('div');
    messageHeaderSection.setAttribute('class',`${disableButtons?'':'pointer '}pb-2 d-flex flex-row d-flex justify-content-between border-bottom border-dark-subtle text-wrap`);
    messageContentSectionDiv.appendChild(messageHeaderSection);


    let messageSenderName = document.createElement('p');
    messageSenderName.setAttribute('class','me-4 mb-0 fs-6');
    messageSenderName.textContent = messageObj.sender;

    let openUserProfile = () => {
        profileSectionGenerator(userId.toString()).then((profileModal) => {
            profileModal.show();
        });
    }
  
    messageHeaderSection.addEventListener('click',openUserProfile);

    let messageSendTime = document.createElement('p');
    messageSendTime.setAttribute('class','mb-0 fs-6 text-secondary');
    messageSendTime.textContent = messageObj.messageTime;

    let messageContentSection = document.createElement('div');
    messageContentSection.setAttribute('class','message-content text-wrap py-1');
    
    let bodyContent = generateBodySection(messageObj.message,messageObj.image?messageObj.image:null);
    messageContentSection.appendChild(bodyContent);

    if(messageObj.image && !disableButtons){
        bodyContent.classList.add('pointer');
        bodyContent.addEventListener('click',(e) => {
            openImageModal(messageObj.id);
        })
    }

    messageContentSectionDiv.appendChild(messageContentSection);

    let messageEditedDiv= document.createElement('div');
    messageEditedDiv.setAttribute('class','w-100 text-wrap border-top border-dark-subtle d-flex flex-row d-flex');

    if(messageObj.edited){
        let editedText = createEdittedSection(messageObj.editedAt);
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
        let previousMessageValue = messageObj.message?messageObj.message:'';
        let editMessageModalBase = createBasicModalStructure();
        let editMessageModal = new bootstrap.Modal(editMessageModalBase);
        let editMessageModalHeader = editMessageModalBase.children[0].children[0].children[0];
        let editMessageModalBody = editMessageModalBase.children[0].children[0].children[1];
        let editMessageModalFooter = editMessageModalBase.children[0].children[0].children[2];
        editMessageModalHeader.children[0].textContent = 'Edit Message';
        
        let editMessageRadioDiv = document.createElement('div');
        let editTextTypeRadioLabel = document.createElement('label');
        let editImageTypeRadioLabel = document.createElement('label');

        let editTextTypeRadio = document.createElement('input');
        let editImageTypeRadio = document.createElement('input');

        let editMessageTextArea = document.createElement('textarea');
        editMessageTextArea.textContent = previousMessageValue;
        editMessageTextArea.setAttribute('class',`${messageObj.message?'':'d-none '}w-100`);

        let editMessageImageDiv = document.createElement('div');
        editMessageImageDiv.setAttribute('class',`${messageObj.image?'':'d-none'}`);

        let editMessageImageInput = document.createElement('input');
        editMessageImageInput.setAttribute('type','file');
        editMessageImageInput.setAttribute('class','form-control mb-2');

        let editMessageImagePreview = document.createElement('div');
        editMessageImagePreview.setAttribute('class','editMessageImagePreview');
        if(messageObj.image != null){
            editMessageImagePreview.style.backgroundImage = `url(${messageObj.image})`;
        }
        editMessageImageDiv.appendChild(editMessageImageInput);
        editMessageImageDiv.appendChild(editMessageImagePreview);
        
        editMessageImageInput.addEventListener('change', (e) => {
            try {
                fileToDataUrl(editMessageImageInput.files[0]).then((base64String) => {
                    editMessageImagePreview.style.backgroundImage = `url(${base64String})`;
                }).catch(e => {
                    throw Error(e);
                })
            } catch (e) {
                showMessageModal('Error',e);
                editMessageImageInput.value = '';
            }
        })


        editMessageRadioDiv.setAttribute('class','form-check d-flex flex-row gap-1 mb-2');

        editTextTypeRadio.setAttribute('type','radio');
        editTextTypeRadio.setAttribute('value','text');
        editTextTypeRadio.setAttribute('id','message-edit-text-radio');
        editTextTypeRadio.setAttribute('name','message-edit-radio');
        editTextTypeRadioLabel.setAttribute('class','form-check-label');
        editTextTypeRadioLabel.setAttribute('for','message-edit-text-radio');
        editTextTypeRadioLabel.textContent = 'Text';

        editImageTypeRadio.setAttribute('type','radio');
        editImageTypeRadio.setAttribute('value','image');
        editImageTypeRadio.setAttribute('id','message-edit-image-radio');
        editImageTypeRadio.setAttribute('name','message-edit-radio');
        editImageTypeRadioLabel.setAttribute('class','form-check-label');
        editImageTypeRadioLabel.setAttribute('for','message-edit-text-radio');
        editImageTypeRadioLabel.textContent = 'Image';
        if(messageObj.message){
            editTextTypeRadio.checked = true;
        } else {
            editImageTypeRadio.checked = true;
        }

        let handleRadioSelectionChange = (e) => {
            if(editTextTypeRadio.checked){
                editMessageImagePreview.style.backgroundImage = '';
                editMessageImageInput.value = '';
                editMessageTextArea.value = previousMessageValue;
                if(editMessageTextArea.classList.contains('d-none')){
                    editMessageTextArea.classList.remove('d-none');
                }
                if(!editMessageImageDiv.classList.contains('d-none')){
                    editMessageImageDiv.classList.add('d-none');
                }
            } else if (editImageTypeRadio.checked){
                if(editMessageImageDiv.classList.contains('d-none')){
                    editMessageImageDiv.classList.remove('d-none');
                }
                if(!editMessageTextArea.classList.contains('d-none')){
                    editMessageTextArea.classList.add('d-none');
                }
                editMessageTextArea.value = '';
            }
        }


        editTextTypeRadio.addEventListener('click',handleRadioSelectionChange);
        editImageTypeRadio.addEventListener('click',handleRadioSelectionChange);

        editMessageRadioDiv.appendChild(editTextTypeRadioLabel);
        editMessageRadioDiv.appendChild(editTextTypeRadio);
        editMessageRadioDiv.appendChild(editImageTypeRadioLabel);
        editMessageRadioDiv.appendChild(editImageTypeRadio);

        editMessageModalBody.appendChild(editMessageRadioDiv);
        editMessageModalBody.appendChild(editMessageTextArea);
        editMessageModalBody.appendChild(editMessageImageDiv);
        editButton.addEventListener('click',(e) => {
            editMessageModal.show();
        })

        let confirmEditMessageButton = document.createElement('button');
        confirmEditMessageButton.setAttribute('class','btn btn-primary');
        confirmEditMessageButton.textContent = "Edit";

        editMessageModalFooter.prepend(confirmEditMessageButton);

        let editMessageConfirmationModalBase = createConfirmationModal('Warning','Are you sure you want to edit this message');
        let editMessageConfirmationModal = new bootstrap.Modal(editMessageConfirmationModalBase);
        let editMessageConfirmationButton = editMessageConfirmationModalBase.children[0].children[0].children[2].children[0];

        confirmEditMessageButton.addEventListener('click',(e) => {
            editMessageConfirmationModal.show();
        })

        editMessageConfirmationButton.addEventListener('click',(e) => {
            getCreateOrEditMessageRequest(editMessageImageInput,editMessageTextArea,previousMessageValue).then( (messageBody) => {
                let editMessageApi = apiCall(`message/${mainPageStateObject.channelId}/${messageObj.id}`,'PUT',messageBody).then((r) => {
                    let editTime = new Date().toISOString();
                    let editedText = createEdittedSection(`${convertDateToDDMMYY(editTime)} ${getDateHHMM(editTime)}`);
                    messageEditedDiv.replaceChildren(editedText);
                    let newBodyContent = generateBodySection(messageBody.message,messageBody.image?messageBody.image:null);
                    messageContentSection.replaceChildren(newBodyContent);
                    if(messageBody.image){
                        newBodyContent.classList.add('pointer');
                        newBodyContent.addEventListener('click',(e) => {
                            openImageModal(messageObj.id);
                        })
                    }
                    editMessageConfirmationModal.hide();
                    editMessageModal.hide();
                }).catch((e) => {});
            }).catch((e) => showMessageModal('Error', e))
        })

        let deleteButton = document.createElement('button')
        deleteButton.setAttribute('class','btn btn-danger border border-dark emoji-button p-1 me-1');
        let deleteButtonIcon = document.createElement('i');
        deleteButtonIcon.setAttribute('class','bi bi-trash');

        if(disableButtons) {
            editButton.setAttribute('disabled','');
            deleteButton.setAttribute('disabled','');
            messageSenderName.removeEventListener('click',openUserProfile);
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

const generateInviteCheckBoxes = (userObj) => {
    let checkBoxContainerDiv = document.createElement('div');
    checkBoxContainerDiv.setAttribute('class','d-flex flex-row');
    let checkBoxLabelDiv = document.createElement('div')
    let checkBoxDiv = document.createElement('div')
    let checkBoxLabel = document.createElement('label');
    let checkBoxElement = document.createElement('input');
    checkBoxLabel.setAttribute('class','form-check-label');
    checkBoxLabel.setAttribute('for',`checkbox-${userObj.id}`);
    checkBoxLabel.textContent = userObj.name;
    checkBoxLabelDiv.setAttribute('class','w-90');
    checkBoxLabelDiv.appendChild(checkBoxLabel);

    
    checkBoxElement.setAttribute('type','checkbox');
    checkBoxElement.setAttribute('id',`checkbox-${userObj.id}`);
    checkBoxElement.setAttribute('value',userObj.id);
    checkBoxElement.setAttribute('class','form-check-input');

    checkBoxDiv.appendChild(checkBoxElement);
    checkBoxContainerDiv.appendChild(checkBoxLabelDiv);
    checkBoxContainerDiv.appendChild(checkBoxDiv)
    return checkBoxContainerDiv;
}



const getChannelDetails = (channelId, channelName) => {
    return new Promise( (resolve, reject) => {
        let channelPageDiv = document.getElementById('channel-page-section');
        let channelInformation =  apiCall(`channel/${channelId}`,'GET',null,null,false);
        channelInformation.then((response) => {
            channelPageDiv.replaceChildren();
            let channelNameHeading = document.createElement('h5');
            channelNameHeading.textContent = channelName;
            channelNameHeading.setAttribute('class','text-wrap')
            channelPageDiv.appendChild(channelNameHeading);
            getObjectOfUserDetails(response.members).then((members) => {
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
                                userImage: members[message.sender].image,
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

                let inviteToChannelModalBase = createBasicModalStructure();
                let inviteToChannelModal = new bootstrap.Modal(inviteToChannelModalBase);
                let inviteToChannelModalHeader = inviteToChannelModalBase.children[0].children[0].children[0];
                let inviteToChannelModalBody = inviteToChannelModalBase.children[0].children[0].children[1];
                let inviteToChannelModalFooter = inviteToChannelModalBase.children[0].children[0].children[2];
                inviteToChannelModalHeader.children[0].textContent = 'Invite Users to Channel';

                let selectAllButton = document.createElement('button');
                selectAllButton.setAttribute('class','btn btn-light border-dark me-1 mb-1');
                selectAllButton.textContent = 'Select All';

                let deselectAllButton = document.createElement('button');
                deselectAllButton.setAttribute('class','btn btn-secondary border-dark mb-1');
                deselectAllButton.textContent = 'Deselect All';
                let inviteModalInviteButton = document.createElement('button');
                inviteModalInviteButton.setAttribute('class','btn btn-primary');
                inviteModalInviteButton.textContent = "Invite";
                inviteToChannelModalFooter.prepend(inviteModalInviteButton);

                inviteToChannelButton.addEventListener('click',(e) => {
                    inviteToChannelModalBody.replaceChildren(selectAllButton,deselectAllButton);
                    let allUsersList = apiCall('user','GET');
                    allUsersList.then((response) => {
                        let currentMemberInChannel = Object.keys(members);
                        let usersNotInChannel = response.users.filter((user) => !currentMemberInChannel.includes(user.id.toString()));
                        usersNotInChannel = usersNotInChannel.map((userObj) => userObj.id);
                        let getUserDetailsApi = getObjectOfUserDetails(usersNotInChannel);
                        getUserDetailsApi.then((userObjects) => {
                            let sortedArray = []
                            for (let userId in userObjects){
                                let userObject = {
                                    id:userId,
                                    ...userObjects[userId]
                                }
                                sortedArray.push(userObject);
                            }
                            sortedArray.sort((a,b) => {
                                if (a.name.toLowerCase() < b.name.toLowerCase()) {
                                    return -1;
                                } else if (a.name.toLowerCase() === b.name.toLowerCase()) {
                                    return 0;
                                } else {
                                    return 1;
                                }
                            
                            });
                            sortedArray.forEach((userObj) => {
                                let checkbox = generateInviteCheckBoxes(userObj);
                                checkbox.classList.add('border-bottom','border-dark');
                                inviteToChannelModalBody.appendChild(checkbox);
                            });
                            inviteToChannelModalBody.lastChild.classList.remove('border-bottom','border-dark');

                            let checkBoxButtons = inviteToChannelModalBody.querySelectorAll('input');
                            selectAllButton.addEventListener('click', (e) => {
                                checkBoxButtons.forEach((button) => {
                                    button.checked = true;
                                })
                            })
                            deselectAllButton.addEventListener('click', (e) => {
                                checkBoxButtons.forEach((button) => {
                                    button.checked = false;
                                })
                            })

                            inviteToChannelModal.show();

                            inviteModalInviteButton.addEventListener('click', (e) => {
                                let checkedButtons = inviteToChannelModalBody.querySelectorAll('input:checked');
                                let userIdsToInvite = [];
                                checkedButtons.forEach((checkBoxDom) => {
                                    userIdsToInvite.push(checkBoxDom.value);
                                })
                                if(userIdsToInvite.length < 1){
                                    showMessageModal('Error','You need to select atleast 1 user to invite');
                                } else {
                                    console.log(userIdsToInvite);
                                    inviteMultipleUsers(userIdsToInvite,channelId).then((r) => {
                                        inviteToChannelModal.hide();
                                        getChannelDetails(channelId,channelName);
                                    }).catch((e) => {});
                                }
                            })

                        })
                    })
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
                let sortedMembers = []
                for (let userId in members){
                    let userObject = {
                        id:userId,
                        ...members[userId]
                    }
                    sortedMembers.push(userObject);
                }
                console.log(sortedMembers);


                sortedMembers.sort((a,b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) {
                        return -1;
                    } else if (a.name.toLowerCase() === b.name.toLowerCase()) {
                        return 0;
                    } else {
                        return 1;
                    }
                
                });

                console.log(sortedMembers);

                for (let member of sortedMembers){
                    // console.log(member);
                    let liObj = document.createElement('li');
                    liObj.setAttribute('class','px-1 py-1 text-nowrap');
                    let aObj = document.createElement('a');
                    aObj.textContent = member.name;
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
                resolve([members,true]);
                }).catch((e) => {})
        }).catch((e) => {
            if(e !== 'Server Error'){
                channelPageDiv.replaceChildren();
                let channelNameHeading = document.createElement('h5');
                channelNameHeading.textContent = channelName;
                channelNameHeading.setAttribute('class','text-wrap')
                channelPageDiv.appendChild(channelNameHeading);
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
                resolve([null,false]);
            }
        })
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
            refreshChannelList(response.channelId,myModal)
        }).catch((e) => {});
    })
    modalFooter.prepend(createButton);
    myModal.show();

})



window.addEventListener("hashchange",() => {
    let mainPage = document.getElementById('main-page');
    if(!mainPage.classList.contains('d-none')){
        let urlFragment = location.hash.split('=');
        if (urlFragment[0] === '#channel'){
            console.log(urlFragment[0]);
            console.log(urlFragment[1]);
            getChannelData(urlFragment[1]);
        } else if (urlFragment[0] === '#profile') {
            let userId = ''
            if(urlFragment.length > 1) {
                userId = urlFragment[1]
            } else {
                userId = localStorage.getItem('userId');

            }
            profileSectionGenerator(userId).then((profileModal) => {
                profileModal.show();
            })
        }
    }

});


document.getElementById('notification-button').addEventListener('click', (e) => {
    // createMessage();
    // console.log(`Element Scroll height is ${messageWindow.scrollHeight}`);
    // console.log(`Element Offset height is ${messageWindow.offsetHeight}`);
    // console.log(`Element Scroll Top is ${messageWindow.scrollTop}`);
    // console.log(`Element height + scroll is ${messageWindow.offsetHeight + messageWindow.scrollTop}`);
    console.log(profileButton.style.backgroundImage);

})

