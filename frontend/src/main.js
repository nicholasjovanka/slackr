// Helper Functions
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
    getSpecificChannelName,
    getChannelLatestMessages,
    createConfirmationModal,
    inviteMultipleUsers
} from './helpers.js';


/*
-------------------------
Login Page Code
------------------------
*/

let loginPageRegisterButton = document.getElementById('login-page-register-button'); 
loginPageRegisterButton.addEventListener('click', (e) => { //Add an Event Listener to navigate the user to the register page if they click the Login page Register button
    movePage('login-page', 'register-page');
})

let loginPageLoginButton = document.getElementById('login-page-login-button');
let loginPageNameInput = document.getElementById('login-email-input');
let loginPagePasswordInput = document.getElementById('login-password-input');


loginPageLoginButton.addEventListener('click',(e) => { // Add an Event Listener to the login button in the login page, to login the user to the main page
    e.preventDefault();
    loginPageLoginButton.disabled = true; 
    let body = { //Request object containing the users email and password that is inputted to each of its input field in the login page
        email: loginPageNameInput.value,
        password: loginPagePasswordInput.value
    }
    let loginAPI = apiCall('auth/login','POST',body); //Call the login API
    loginAPI.then( (response) => { //If the Login is successful, then save the token and userId in the localstorage and navigate them into the main page.
        localStorage.setItem('token',`Bearer ${response.token}`);
        localStorage.setItem('userId',response.userId)
        movePage('login-page','main-page');
        getAllChannels(true).catch((e) => {}); //Function that populates the channel List and initialize the notification system
        loadProfilePicture(); //Function that loads the user profile picture
    }).catch((e) => {})
    .finally( () => {
        loginPageLoginButton.disabled = false;
    });
})


/*
-------------------------
Register Page Code
------------------------
*/
let registerPageNameInput = document.getElementById('register-name-input');

const validateRegisterPageNameInput = () => { //Function used to validate the Register Page Name Input to make sure its not empty
    let registerNameWarningDiv = document.getElementById('register-name-invalid-message');
    return !emptyInputValidator(registerPageNameInput,registerNameWarningDiv,'Name');
}

registerPageNameInput.addEventListener('blur', (e) => {
    validateRegisterPageNameInput();
})



let registerPageEmailInput = document.getElementById('register-email-input');

const validateRegisterPageEmailInput = () => { //Function used to validate the Register Page Email Input to make sure its not empty and to ensure its a valid email
    let valid = true;
    let registerEmailWarningDiv = document.getElementById('register-email-invalid-message');
    let isEmpty = emptyInputValidator(registerPageEmailInput,registerEmailWarningDiv,'Email');
    if(!isEmpty) {
        let emailIsValid = checkEmail(registerPageEmailInput.value);
        if (!emailIsValid) {
            registerEmailWarningDiv.textContent = 'Wrong Email Format';
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


/*
Function used to validate the Register Page Password and Confirm Password Input to make sure its not empty 
and to ensure both password is the same
*/
const validateRegisterPagePasswordInput = () => { 
    let registerPasswordWarningDiv = document.getElementById('register-password-invalid-message');
    let errorMessage = '';
    let valid = true;
    if(registerPagePasswordInput.value.length === 0 || registerPageConfirmPasswordInput.value.length === 0){ //Checks if either the password field is empty
        errorMessage = `${registerPagePasswordInput.value.length === 0?'Password':'Confirm Password'} field cannot be empty`
        valid = false;
    } else {
        if(registerPagePasswordInput.value === registerPageConfirmPasswordInput.value) { //Checks if both password field has the same value
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


//Hyperlink Element that on click navigates the user back to the login page from the register page
let registerPageLoginHyperLink = document.getElementById('register-page-a-element'); 

registerPageLoginHyperLink.addEventListener('click', (e) => {
    e.preventDefault();
    movePage('register-page','login-page');
})


let registerPageButton = document.getElementById('register-page-submit-button');


/*
Bind the register button in the register page to a function that submits a register request to the backend server
using the input fields from the register page.
The function also checks for invalid fields and will return an error if the password and confirm password fields is not the same
*/
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
        registerApi.then( (response) => { //Upon a succesfull register request to the backend, move the user to the main page and save the userId and token to the localStorage
            localStorage.setItem('token',`Bearer ${response.token}`);
            localStorage.setItem('userId',response.userId)
            movePage('register-page','main-page');
            getAllChannels(true).catch((e) => {});  //Function that populates the channel List and initialize the notification system
            loadProfilePicture(); //Function that loads the user profile picture
        }).catch( (e) => {
            registerPageButton.disabled = false;
        })
    } catch(e){
        registerPageButton.disabled = false;
        showMessageModal('Error', e.message)
    }
})



/*
-------------------------
Main Page Code
------------------------
*/

//General Element Getters

let openButton = document.getElementById('open-button'); //Button that only shows on screen below 700px width that allows the user to open and hide the channel list 

/*
The sidebar or in this case the portion of the user screen (The left side of the user screen) that contains the 
users list of channels (public channel and private channel that they have joined)
*/
let channelBar = document.getElementById('channel-list-sidebar'); 

let profileButton = document.getElementById('profile-button'); //The Profile button on the top right side of the user screen that allows them to open the edit profile menu and logout 


let messageWindow = document.getElementById('channel-messages'); //The div containing the messages in a server, or in other words the message window where the user can see the messages

/*
The div or the right section of the user screen in the main page that contains the details of a channel along with
buttons that allow them to invite people, see pinned message and much more
*/
let channelPageDiv = document.getElementById('channel-page-section'); 

let chatTextAreaDiv = document.getElementById('text-area-div'); //Div containing the text area where the user can input the message they want to send
let chatTextArea = document.getElementById('chat-input'); //Text area where the user can type the message they want to send to a channel

/*
//Label that overlays the file input used to send a file as a message to a channel so that I can use icons as the file input instead of the default html file input
*/
let fileInputLable = document.getElementById('file-input-label'); 
let fileInput = document.getElementById('file-input'); //File input used to send a file as a message to a channel
let fileDisplayerDiv = document.getElementById('file-displayer-div'); //A div used to preview the image that the user is about to send to a channel
let fileInputCancelButton = document.getElementById('cancel-file-upload-button'); //A button used to cancel the file that user have selected in the fileInput
let sendMessageButton = document.getElementById('send-message-button'); //A button used by the user to send a text message or an image to a channel


openButton.addEventListener('click',(e) => {  //Click Event listener on the openButton that provides the slide in and slide out animation for the channelBar
    let isOpen = channelBar.classList.contains('slide-in');
    if(isOpen){
        channelBar.classList.remove('slide-in');
        channelBar.classList.add('slide-out');
        openButton.textContent = ' > ';
    } else {
        channelBar.classList.remove('slide-out');
        channelBar.classList.add('slide-in');
        openButton.textContent = ' < ';
    }
})


//Click eventlistener on the fileInputLable to simulate a click on the fileInput so that the fileInputLable can be used like a button
fileInputLable.addEventListener('keypress',(e) => { 
    if(e.key === 'Enter' && !fileInput.hasAttribute('disabled')) {
        fileInput.click();
    }
})


//Event listener on the fileInputCancelButton that on click will reset the fileInput value and close the image preview
fileInputCancelButton.addEventListener('click',(e) => {
    fileDisplayerDiv.classList.add('d-none');
    fileInput.value = '';
    chatTextArea.removeAttribute('disabled');
});


/*
Event listener on the fileInput where on file change it will validate if the file is png/jpeg/jpg and display it in the image preview.
Other than that if its a valid file then disable the text area as the user can only either send an image or a text message.
*/
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


//General Main Page Function and Object

let mainPageStateObject = { // State Object which is used to help us keep track of the infinity scroll, other than that also helps to pass around the channelId 
    currentIndex: 0, //Index of current infinity scroll, correspond to the starm url parameter used in the getMessages api
    channelId: 0, //Current visited channel channel id
    userInChannel: false, 
    usersObject:{} //Object containing the details of members from a specific channel so that we dont have to call the api everytime for each different function that uses the userObjects
}



let loadProfilePicture = () => { // Function used to get the current logged in user profile image so that we can load it in the profile button 
    let userId = localStorage.getItem('userId');
    getObjectOfUserDetails([userId]).then((userObj) => {
        let profilePicture = `url(${userObj[userId].image?userObj[userId].image:'../assets/user.svg'})`; //If the user dont have an image then use the default profile iamge
        profileButton.style.backgroundImage = profilePicture; //Set the image as the profile button background image
    })
}

const getChannelData = (channelId) => { //Function that will trigger when a user visits a channel, sets up the channel messages, infinite scroll, and also get the channel details
    let channelInputDiv = document.getElementById('channel-input-div');
    getSpecificChannelName(channelId).then((channelName) => {
        getChannelDetails(channelId,channelName).then(([usersObject,userInChannel]) => {
            mainPageStateObject = { //Reset the state object 
                currentIndex:0, //Reset the index to 0 so that the application will fetch the latest messages from the channel visited
                channelId,
                userInChannel,
                usersObject
            }
            removeInfiniteScroll(); //Remove previous existing infinity scroll if there is one
            sendMessageButton.removeEventListener('click',sendMessageFunction); // Remove existing Event listener from the send message button
            messageWindow.replaceChildren();
            chatTextArea.value = '';
            if(userInChannel){ //If the user is in the channel, then populate the messages and details
                let loadingSpinnerDiv = document.createElement('div'); //Spinner used for the infinity scroll
                loadingSpinnerDiv.setAttribute('class','d-none d-flex justify-content-center');
                loadingSpinnerDiv.setAttribute('id','chatbox-spinner');
                loadingSpinnerDiv.setAttribute('role','status');
                let loadingSpinner = document.createElement('div');
                loadingSpinner.setAttribute('class','spinner-border');
                loadingSpinnerDiv.appendChild(loadingSpinner);
                messageWindow.appendChild(loadingSpinnerDiv);
                getChannelMessages(channelId,false).then((r) => { //Get the latest 25 messages from the channel and put them in the channelWindow element
                    if(mainPageStateObject.currentIndex !== -1){  //If the state object current index is not -1 it means that there is messages in the channel, so add infinity scroll
                        messageWindow.addEventListener('scroll', handleInfiniteScroll);
                        messageWindow.scrollTop = messageWindow.scrollHeight; //if scrollable, scroll the user cursor in the messageWindow to the very bottom to see the latest message
                    }
                    if(chatTextArea.hasAttribute('disabled')){ //Enable the chat text area and the file input if it was disabled before.
                        chatTextArea.removeAttribute('disabled');
                        fileInput.removeAttribute('disabled');
                        fileInputLable.classList.remove('disabled');
                        sendMessageButton.removeAttribute('disabled');
                    }
                    sendMessageButton.addEventListener('click',sendMessageFunction); //Register the send message function to the send message button
                });
            } else { //If user is not in channel then disable the text area and file input.
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


// Notification System

/*
Button shown in the top right of the user screen with the icon of a bell that on click shows the notification modal to the user
*/
let notificationButton = document.getElementById('notification-button'); 
let notificationClearbutton = document.getElementById('clear-notification-button'); //The button in the notification modal to clear all notifications

/*
Span element located on the bottom right of the notification Button that represents the number of new notification for the user
*/
let notificationNumber = document.getElementById('notification-number'); 
let notificationModalBase = document.getElementById('notification-modal'); //Modal base for the notification modal
let notificationMenu = document.getElementById('notification-menu'); //Div inside the notification modal body that contains the notifications.
let notificationModal =new bootstrap.Modal(notificationModalBase); //Bootstrap modal object for the notification modal

/*
//Variable used to store the reference for the setInterval function containing getNotificationCounterFunction that updates the notification counter so that we
can use clear interval on it later to remove it incase the user logouts
*/
let notificationCounterIntervalFunctionReference; 

/*
Variable used by the getNotificationCounterFunction to get the number of new messages from each of the user joined channel channelNotificationFunction that runs at a set interval
*/
let amountOfNewMessages = 0; 

/*
Object used to store the references of the setInterval functions that executes the channelNotificationFunction() function for each of the user joined Channel so that
we can use clearInterval on it later incase the user logs out or leave a channel. The key in the object is the channelId
*/
let notificationObjectIntervalTracker = {} 

/*
Object used to track the last id of the message received from each of the user joined channel at each updated notification to know the amount of new message after 
the last message. The key in the object is the channelId
*/
let notificationObjectStateTracker = {}

/*
Object that maps the channelName to the channelIds of the channel that the user joined which is used to get the channel name when creating the notification late,r
The key in the object is the channelId
*/
let notificationObjectChannelName = {}


const createNotification = (channelId) => { //Function to create the notification element inside the notification modal/notification menu
    let notificationFlexDiv = document.createElement('div');
    notificationFlexDiv.setAttribute('class','d-flex border border-dark ps-3 pt-3 pb-3 pe-0');
    notificationFlexDiv.setAttribute('data-channel',channelId);
    let notificationBody = document.createElement('div');
    notificationBody.setAttribute('class','toast-body');
    notificationBody.textContent = `New Message in ${notificationObjectChannelName[channelId]}`;
    let notificationCloseButton = document.createElement('button');
    notificationCloseButton.setAttribute('class','btn-close me-2 m-auto');
    notificationCloseButton.setAttribute('type','button');
    notificationCloseButton.setAttribute('aria-label','Close');
    notificationCloseButton.addEventListener('click',(e) => {
        notificationFlexDiv.remove();
    })
    notificationFlexDiv.appendChild(notificationBody);
    notificationFlexDiv.appendChild(notificationCloseButton);
    return notificationFlexDiv;
}



/*
Function that will update the notification number/counter below the notification button at a set interval which shows the user that there
is new messages from each of their joined channel
*/
const getNotificationCounterFunction = () => { 
    let serverError = amountOfNewMessages === null; //If the amount of new messages is null, then we know that there was a connection error (the backend server died or disconnected)
    if(serverError){ 
        /*
        If there is a connection error then remove the setInterval containing the getNotificationCounterFunction using 
        the notificationCounterIntervalFunctionReference reference variable  
        */
        clearInterval(notificationCounterIntervalFunctionReference);
    } else { //If there is no server error, then update the counter number in the span.
        let amountOfNotification = notificationNumber.textContent === ''?0:Number(notificationNumber.textContent);
        amountOfNotification+= amountOfNewMessages;
        amountOfNewMessages = 0;
        if(amountOfNotification > 0){
            notificationNumber.textContent = amountOfNotification.toString();
        }
    }
    
}


/*
Function that will be to used to poll new messages from each of the user joined channel, and check if there is new messages in
the channel that does not come from the user
*/
const channelNotificationFunction = (channelId) => {
        let userId = Number(localStorage.getItem('userId')); //Get the current user id
        getChannelLatestMessages(channelId).then((messages) => { //Get the latest channel messages
            let previousMessageId = notificationObjectStateTracker[channelId]; //Using the state tracker object, we get the latest message id from when the last time this function is called
            let messagesToTraverseStartIndex = 0; //Start index variable which is used to tell the function where to iterate from in the new messages array
            if(messages.length > 0){ //If the messages is not empty then proceed
                if (notificationObjectStateTracker[channelId] === null) { //Check if the State Object for the current channel is null, as if its null then the channel previously has no messages
                    messagesToTraverseStartIndex = messages.length - 1; //Set the start index to be the last message in the latest messages
                } else { 
                    //If the previous state object is not null then get the index of the previous latest message id in the array and minus it by 1 and set it as the start index 
                    let previousMessageIndex = messages.map(e => e.id).indexOf(previousMessageId); 
                    messagesToTraverseStartIndex = previousMessageIndex - 1;
                }
                /*
                Update the state object for the current channel to be the latest message (in this case the first item since the api fetch in a reverse manner where the latest message is the first item)
                for the next time this function is called again in the next interval
                */
                notificationObjectStateTracker[channelId] = messages[0].id; 
                for(let i = messagesToTraverseStartIndex ; i >= 0 ; i--){ //Loop through all the messages that appears after the previous message
                    /*
                    //If there is a new message where the sender is not the current user then update the amountOfNewMessages variable so later it
                    will be displayed by the getNotificationCounterFunction once that function runs again on the next interval.
                    Then also create the notification object and add it to the notification modal.
                    */
                    if(messages[i].sender !== userId ) { 
                        amountOfNewMessages+=1;
                        let newNotification = createNotification(channelId);
                        notificationMenu.prepend(newNotification);
                    }
                }
            }
        }).catch((e) => {
            if(e === 'Server Error') { 
                /*
                If the error is a server error where the backend server disconnect then call clearinterval on this function using the 
                reference that we store in the notificationObjectIntervalTracker. Other than that, update the amountOfNewMessages variable to null
                so that the getNotificationCounterFunction knows that there is an server error at the next interval that it runs.
                */
                if (channelId in notificationObjectIntervalTracker) {
                    clearInterval(notificationObjectIntervalTracker[channelId]);
                    delete notificationObjectIntervalTracker[channelId];
                    amountOfNewMessages = null;
                }
            }
        })
}

/*
Function used to create a new setInterval function of the channelNotificationFunction for each of the public and private channels passed in the function parameter
so that the application starts poling these channels for new messages in order to get notifications for the current user.
Additionaly, if initializeMode in the parameter is not false, then it tells the function to also initialize the getNotificationCounterFunction so that the interval
that updates the notification number in the UI also starts.
*/
const addChannelsToNotification = (publicChannels, privateChannels,initializeMode = false) => {
    return new Promise((resolve,reject) => {
        publicChannels.forEach((publicChannel) => { //Iterate through all the channels object in the public channels array
            getChannelLatestMessages(publicChannel.id).then((messages) => {
                if(messages.length > 0 ) { //Get the channel latest message id and store it in the state object, if there is no message then set it as null
                    notificationObjectStateTracker[`${publicChannel.id}`] = messages[0].id;
                } else {
                    notificationObjectStateTracker[`${publicChannel.id}`] = null;
                }
                notificationObjectChannelName[`${publicChannel.id}`] = publicChannel.name; //Store the channel name using the notificationObjectChannelName object
                //Initialize the set interval function that calls the channelNotificationFunction for this channel and store the set interval reference in the notificationObjectIntervalTracker
                notificationObjectIntervalTracker[`${publicChannel.id}`] = setInterval(() => {channelNotificationFunction(`${publicChannel.id}`)},1500); 
            })
        })

        privateChannels.forEach((privateChannel) => {
            getChannelLatestMessages(privateChannel.id).then((messages) => {
                if(messages.length > 0 ) {  //Get the channel latest message id and store it in the state object, if there is no message then set it as null
                    notificationObjectStateTracker[`${privateChannel.id}`] = messages[0].id;
                } else {
                    notificationObjectStateTracker[`${privateChannel.id}`] = null;
                }
            })
            notificationObjectChannelName[`${privateChannel.id}`] = privateChannel.name;//Store the channel name using the notificationObjectChannelName object
                            //Initialize the set interval function that calls the channelNotificationFunction for this channel and store the set interval reference in the notificationObjectIntervalTracker
            notificationObjectIntervalTracker[`${privateChannel.id}`] = setInterval(() => {channelNotificationFunction(`${privateChannel.id}`)},1500);
        })
        if(initializeMode){
            notificationCounterIntervalFunctionReference = setInterval(() => getNotificationCounterFunction(), 3000);
        }
    })
}


//Function that is used to register a new channel to the notification system incase the user joined a new channel
const addJoinedChannelToNotification = (channelId) => {
    apiCall(`channel/${channelId}`,'GET',null,null,false).then((response) => {
        let channelObject = {id:channelId, ...response}
        addChannelsToNotification([channelObject],[]);
    })
}

//Function that is used to remove a channel from notification system incase the user left a channel
const removeChannelFromNotification = (channelId) => {
    clearInterval(notificationObjectIntervalTracker[channelId]);
    delete notificationObjectIntervalTracker[channelId];
    delete notificationObjectChannelName[channelId];
    delete notificationObjectStateTracker[channelId];
    //Gets all existing notification object related to the channel that the user just left in the notification modal and remove it
    let existingNotifications = notificationMenu.querySelectorAll(`[data-channel='${channelId}']`); 
    existingNotifications.forEach((e) => {
        e.remove();
    })
    if(existingNotifications.length > 0){ //Update the notification number shown by the span in the UI.
        let amountOfNotification = Number(notificationNumber.textContent);
        amountOfNotification -= existingNotifications.length;
        if(amountOfNotification === 0) {
            notificationNumber.textContent = '';
        }

    }
}

//Function that is used to updates the channel name in existing notifications incase a channel name is updated
const updateChannelNameInNotification = (channelId, newChannelName) => {
    let existingNotifications = notificationMenu.querySelectorAll(`[data-channel='${channelId}']`);
    notificationObjectChannelName[channelId] = newChannelName; 
    existingNotifications.forEach((e) => {
        e.children[0].textContent = `New Message in ${notificationObjectChannelName[channelId]}`;
    })
}


notificationButton.addEventListener('click', (e) => {
    notificationModal.show();
})

notificationClearbutton.addEventListener('click', (e) => {
    notificationMenu.replaceChildren();
})

notificationModalBase.addEventListener('hide.bs.modal', (e) => { //Event listener to reset the notification counter when the notification modal is closed
    amountOfNewMessages = 0;
    notificationNumber.textContent = '';
})

//Navbar Section

/*
Function that is used to generate the view profile and edit profile modal.
the edittable parameter tells the function which component to generate where if
the edittable is false then it will only generate the view profile modal, otherwise
it generates the edit profile modal
*/
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
        getObjectOfUserDetails([userId]).then((userObj) => { //Get the User details of the user specified in the userId function parameter
            let initialUserImage = `url(${userObj[userId].image?userObj[userId].image:'../assets/user.svg'})`;
            profileImageDiv.style.backgroundImage = initialUserImage;
            profileBaseDiv.appendChild(profileImageDiv);
            if(edittable){ //If edittable is true then generate an edit profile modal
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
                        fileToDataUrl(editProfileFileInput.files[0]?editProfileFileInput.files[0]:null).then((base64String) => {
                            if(base64String !== null){
                                editProfileBody['image'] = base64String;
                            }
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
            } else { //If edittable is false then generate an view profile modal
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
            resolve(profileModal); //Return the modal
        })
    })
  
    
}



/*
bind a function to the profile button so that on click it will show the 
user a modal that contains the edit profile and logout button . This modal will also
show the current user image.
*/
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

    //Bind the editProfileButton inside the profileMenuSection Modal to show an edit profile modal to allow the current user to edit their profile
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

    
    //Bind the Logout button to logout the user once the button is clicked
    logOutButton.addEventListener('click', (e) => {
        for(let channelId in notificationObjectIntervalTracker){ //Clear all the channelNotificationFunction setInterval functions and clear the notification objects
            clearInterval(notificationObjectIntervalTracker[channelId]);
            delete notificationObjectIntervalTracker[channelId];
            delete notificationObjectChannelName[channelId];
            delete notificationObjectStateTracker[channelId];
        }
        clearInterval(notificationCounterIntervalFunctionReference); //Clear the getNotificationCounterFunction setInterval function
        notificationMenu.replaceChildren(); //Clear the notification menu in the notification modal
        amountOfNewMessages = 0; // Reset the amount of messages
        notificationNumber.textContent = ''; //reset the notification number
        removeInfiniteScroll(); // Remove the infinite scroll
        messageWindow.replaceChildren(); // Clear the message Window
        channelPageDiv.replaceChildren(); // Clear the Channel details in the channelPageDiv
        localStorage.removeItem('userId'); //Clear the stored userId from the local storage
        localStorage.removeItem('token'); //Clear the stored token from the local storage
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

//Function to create the private channel list and public channel list <ul> elements that will be displayed in the channel list sidebar
const createChannelListDiv = (channelArray) => {
    let ulListObject = document.createElement('ul');
    ulListObject.setAttribute('class', 'px-1 w-100 h-100');
    let userId = localStorage.getItem('userId');
    channelArray.forEach( (channel) => { //Loop through the channels and create the <li> elements for each channel
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
        /*
        Bind a click event to each <li> object to update the screen with content based on the channel that the liObj using the
        getChannelData function
        */
        liObj.addEventListener('click', (e) => { 
            getChannelData(channel.id);
        })
    })
    return ulListObject;

}

/*
Function that is used to populate the channel list sidebar.
Additionaly, the populateNotificationChannelList is used to tell the function if it should also initialize
the notification system
*/
const getAllChannels = (populateNotificationChannelList = false) => {
    return new Promise( (resolve,reject) => {
        let userId = Number(localStorage.getItem('userId'));
        let publicChannelDiv = document.getElementById('channel-list-public');
        let privateChannelDiv = document.getElementById('channel-list-private');
        publicChannelDiv.replaceChildren();
        privateChannelDiv.replaceChildren();
        let channelResponse = apiCall('channel','GET');
        channelResponse.then( (response) => { //Get the list of all channels
            let publicChannels = response.channels.filter((obj) => obj.private === false); //Filter public channels
            let privateChannels = response.channels.filter((obj) => obj.private === true && obj.members.includes(userId)); //Filter private channels where the current user is amember
            let publicChannelUl = createChannelListDiv(publicChannels);
            let privateChannelUl = createChannelListDiv(privateChannels);
            if(populateNotificationChannelList) {
                //Add all private and public channels that the current user is a member of to the notification system 
                addChannelsToNotification(publicChannels.filter((obj) => obj.members.includes(userId)),privateChannels,true); 
            }
            publicChannelDiv.appendChild(publicChannelUl);
            privateChannelDiv.appendChild(privateChannelUl);
            resolve('');
        }).catch((e) => {})
    })
}

/*
Function that is used to refresh a channel screen, used for when the user edits a channel detail, join a channel, or leave a channel.
Additionaly, this function will also hide the modal that is passed through the function parameter.
*/
const refreshChannelList = (channelId,modalObject=null) => {
    getAllChannels().then((r) => {
        getChannelData(channelId);
        if(modalObject !== null){
            modalObject.hide();
        }
    })
}


//Channel Message Section

/*
Function that is used to form the request object of either then sendMessage Api and the edit message api.
The previousTextValue is a parameter that tells the function if there is a previous value for the message text area which is used for the edit message api
as the user is not allowed to send the same value when editting a message
*/
const getCreateOrEditMessageRequest = (fileInputElement,textArea, previousTextValue = null) => {
    return new Promise( (resolve,reject) => {
        let messageBody = {}
        if (fileInputElement.files[0]) { //check if file input has a file where if it has a file then get the base64 string.
            fileToDataUrl(fileInputElement.files[0]).then((base64String) => {
                messageBody = {
                    image:base64String
                }
                resolve(messageBody);
            }).catch(e => {
                reject(e);
            })
        } else { //If there is no file, then we can deduct that the message is a text based message so get the value from the text area
            if(textArea.value.trim().length < 1){ //Check if the message is an empty string
                reject('Message cannot be empty');
            }
            if(previousTextValue !== null){ //If a previousTextValue is provided then ensure that the new value is not the same with the previous value.
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


//Function that allows a user to send a message to a specific channel that they have joined
const sendMessageFunction = () => {
    getCreateOrEditMessageRequest(fileInput,chatTextArea).then( (messageBody) => {
        let sendMessageApi = apiCall(`message/${mainPageStateObject.channelId}`,'POST',messageBody).then((r) => {
            let members = mainPageStateObject.usersObject;
            mainPageStateObject.currentIndex+=1;
            let getLatestMessageInServer = apiCall(`message/${mainPageStateObject.channelId}`,'GET',null,`start=0`);
            /*
            //Once the message is succesfuly sent to the backend, fetch the latest message from channel in order to get the new message
            current id as the backend id system is not linear (nextMessageId in the backend is shared between the multiple channels) which is
            why we gotta fetch the latest message to ensure that the new message id is accurate
            */
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
                let chatBoxDiv = createMessage(messageObject); //Create the message element based on the message object we get from the response 
                messageWindow.appendChild(chatBoxDiv);// Add the new message element to the messageWindow.
                messageWindow.scrollTop = messageWindow.scrollHeight; //Move the user scroll in the messageWindow to the latest message.
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

//Infinity Scroll Section

let throttleTimer = false; //Timer variable that allows the application to throttle how frequent the user can scroll up/use the infinity scroll

const handleInfiniteScroll = () => { //Infinite Scroll , Inspired from: https://webdesign.tutsplus.com/how-to-implement-infinite-scrolling-with-javascript--cms-37055t
    let spinner = document.getElementById('chatbox-spinner');
    let startOfPage = messageWindow.scrollTop === 0; //Check if user scroll position in the message window is at the very top
    if (!throttleTimer && startOfPage) { //If the user scroll position in the message window is at the very top and the scroll is currently not throttled then do the infinity scroll
        let previousScrollHeight = messageWindow.scrollHeight; //Store the previous scroll height before the messages element is added to know where to move the user cursor once the message is loaded
        throttleTimer = true; //Set the throttle timer to true to ensure that the user cannot use the infinity scroll for a while
        spinner.classList.remove('d-none'); //Display the spinner
        spinner.classList.add('d-flex');
        setTimeout( () => { //use set timeout to allow the spinner to show for a while during the infinite scroll as the api returns its response too quickly
            if (startOfPage) { //Ensure that after 1 second the user scroll position is still on top.
                getChannelMessages(mainPageStateObject.channelId).then((response) => { //Get the channel messages and load them into the message window.
                    if (mainPageStateObject.currentIndex === -1) { //If the current index is -1 after we fetched the messages then we know there is no more messages so remove the infinite scroll
                        removeInfiniteScroll();
                        showMessageModal('Notice','No More Message to Be Loaded');
                    }
                    messageWindow.scrollTop = messageWindow.scrollHeight - previousScrollHeight - 100; //Move the user scroll position in the message window to the last viewed message before the infinity scroll
                }).catch(() => {
                    removeInfiniteScroll();
                }).finally(() =>{
                    //hide the spinner again and allow the user to use the infinite scroll again
                    spinner.classList.remove('d-flex'); 
                    spinner.classList.add('d-none');
                    throttleTimer = false;
                } )
            }
        },1000)
    }
  };
  
// Function that removes the infinite scroll
const removeInfiniteScroll = () => {
    messageWindow.removeEventListener('scroll', handleInfiniteScroll);
};
  
/*
Function that gets messages based on the index in the mainPageStateObject and load them into
the message window. The before scroll basiclly just tells the function whether these elements is added before the spinner element exist or after it already exist
as the most recent 25 messages will always be loaded before the spinner exist while the older messages will be added after the spinner already exist in the message window. 
*/
export const getChannelMessages = (channelId, beforeSpinner = true) => {
    return new Promise( (resolve,reject) => {
        let memberDetails = mainPageStateObject.usersObject;
        let getMessageApi = apiCall(`message/${channelId}`,'GET',null,`start=${mainPageStateObject.currentIndex}`); //Get the messages of a channel from the start index pointed by the mainPageStateObject.currentIndex
        getMessageApi.then((response) => {
            if(response.messages.length > 0) { //Check if there is any messages
                /*
                // Update the index in the mainPageStateObject so that next time this function is called in the infinite scroll it will know which 
                index to get the messages from
                */
                mainPageStateObject.currentIndex += response.messages.length; 
                let messagesList = beforeSpinner?response.messages:response.messages.reverse();
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
                    if(beforeSpinner){
                        messageWindow.insertBefore(chatBoxDiv,messageWindow.children[1]);
                    } else {
                        messageWindow.appendChild(chatBoxDiv);
                    }
                })
            } else { 
                //If there is no more messages that set the mainPageStateObject.currentIndex to -1 so that the application know that there is no more messages for the current channel 
                mainPageStateObject.currentIndex = -1;
            }
            resolve('');
        }).catch((e) => reject(e));
    })
}


//Function that handles the logic that is required when the user reacts to a message
const emojiHandler = (emojiButton, emojiString, channelId, messageId) => {
    let reactApiBody = { //The object required by the react api.
        react:emojiString
    }
    let userId = Number(localStorage.getItem('userId'));
    let currentLength = Number(emojiButton.textContent.split(' ')[1]); //Get the current number of reactions that is currently being displayed in the message emoji button

    /*
    If the button class is btn-light then the user has not reacted to the message, so send a react request to the backend api 
    and update its class to btn-primary and update the number of reacts
    */
    if(emojiButton.classList.contains('btn-light')){ 
        let reactApiCall = apiCall(`message/react/${channelId}/${messageId}`,'POST',reactApiBody);
        reactApiCall.then((response) => {
            emojiButton.classList.remove('btn-light');
            emojiButton.classList.add('btn-primary');
            emojiButton.textContent = `${String.fromCodePoint(Number(emojiString))} ${currentLength+1}`;
        
        }).catch((e) => {})
    } else {
        /*
        If the button class is not btn-light then the user has reacted to the message, 
        so send an unreact request to the backend api and update its class to btn-light and update the number of reacts
        */
        let unReactApiCall = apiCall(`message/unreact/${channelId}/${messageId}`,'POST',reactApiBody);
        unReactApiCall.then((response) => {
            emojiButton.classList.remove('btn-primary');
            emojiButton.classList.add('btn-light');
            emojiButton.textContent = `${String.fromCodePoint(Number(emojiString))} ${currentLength-1}`;
        }).catch((e) => {})
    }
}

//Function used to generate the editted at text in each messages
const createEdittedSection = (timeString) => {
    let editedText = document.createElement('p');
    editedText.setAttribute('class','mb-0');
    editedText.textContent = `Edited at ${timeString}`;
    return editedText;
}


//Function used to generate the html content that represents a message content which can either be an image or text
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

// Function that creates and open an image modal or in a sense an image library where the users can see all the images in the channel
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
        let messageWithImages = messages.filter((message) => message.image).reverse();  //Get all the channel messages and filter the one that has an image
        let maxImageIndex = messageWithImages.length - 1;
        let currentImageIndex = messageWithImages.findIndex((message) => message.id == messageId); //Get the index of the image that the user clicked to open the image modal
        imageModalHeader.children[0].textContent = `Viewing Image ${currentImageIndex+1} out of ${messageWithImages.length} Images`;
        if(currentImageIndex === 0){
            previousButton.setAttribute('disabled','');
        }
        if(currentImageIndex === maxImageIndex) {
            nextButton.setAttribute('disabled', '');
        }
        imageModalImage.setAttribute('src',messageWithImages[currentImageIndex].image);


        let imageModalButtonHandler = (action) => { //Function handler that allows the user to view the next or previous image using the next and previous button
            if(action === 'next'){
                currentImageIndex+=1;
            } else if(action === 'prev') {
                currentImageIndex-=1;
            }
            imageModalImage.setAttribute('src',messageWithImages[currentImageIndex].image);
            imageModalHeader.children[0].textContent = `Viewing Image ${currentImageIndex+1} out of ${messageWithImages.length} Images`;
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


/* 
Function used to create a message object for the messageWindow
the disableButtons parameters is used to tell the function if it should create a message element where
all the buttons is disabled (used for displaying the pinned messages as the user should not be able to interact with the buttons when viewing pinned messages)
*/
const createMessage = (messageObj,disableButtons = false) => {
    let channelId = mainPageStateObject.channelId;
    let userId = Number(localStorage.getItem('userId'));
    let chatBoxDiv = document.createElement('div');
    chatBoxDiv.setAttribute('class','message-chatbox d-flex flex-row flex-wrap border-top border-bottom border-dark px-2');
    chatBoxDiv.setAttribute('data-id', messageObj.id);


    //User Message Sender Picture Section
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


        
    //User Message Sender Section
    let messageSenderName = document.createElement('p');
    messageSenderName.setAttribute('class','me-4 mb-0 fs-6');
    messageSenderName.textContent = messageObj.sender;

    let openUserProfile = () => {
        profileSectionGenerator(messageObj.senderId.toString()).then((profileModal) => {
            profileModal.show();
        });
    }
  
    messageHeaderSection.addEventListener('click',openUserProfile);

    //Message Send Time Section
    let messageSendTime = document.createElement('p');
    messageSendTime.setAttribute('class','mb-0 fs-6 text-secondary');
    messageSendTime.textContent = messageObj.messageTime;

    //Message Content Section
    let messageContentSection = document.createElement('div');
    messageContentSection.setAttribute('class','message-content text-wrap py-1');
    
    let bodyContent = generateBodySection(messageObj.message,messageObj.image?messageObj.image:null);
    messageContentSection.appendChild(bodyContent);

    //If the buttons are not disabled then if the message content is an image then add an event listener so that on click it opens the image modal
    if(messageObj.image && !disableButtons){
        bodyContent.classList.add('pointer');
        bodyContent.addEventListener('click',(e) => {
            openImageModal(messageObj.id);
        })
    }

    messageContentSectionDiv.appendChild(messageContentSection);

    let messageEditedDiv= document.createElement('div');
    messageEditedDiv.setAttribute('class','w-100 text-wrap border-top border-dark-subtle d-flex flex-row d-flex');

    //If the message was editted then display the editted at text in the message element
    if(messageObj.edited){
        let editedText = createEdittedSection(messageObj.editedAt);
        messageEditedDiv.appendChild(editedText);
    }

    let buttonsDiv = document.createElement('div');
    buttonsDiv.setAttribute('class','w-100 text-wrap py-0 d-flex flex-row d-flex justify-content-between border-bottom border-dark-subtle');

    //Pinn Message Section
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

    //If the user is the sender of the current message object then add a delete message button and edit message button if the message wasnt editted previously
    if(userId === messageObj.senderId) { 
        let editButton = document.createElement('button');
        editButton.setAttribute('class','btn btn-link mb-0 p-0');
        editButton.textContent = 'Edit';
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
        confirmEditMessageButton.textContent = 'Edit';

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

        if(disableButtons) { //If disableButtons is activated is the function parameters then disable the edit and delete button.
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



    //Emoji(react) section
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

    
    if(disableButtons){ //If disableButtons is activated is the function parameters then disable all buttons.
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

//Function that generates the Invitation Checkboxes on the Invite User Modal
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



//Function that is used to generate the channel Details section (Right section of the main page that shows the details of a channel)
const getChannelDetails = (channelId, channelName) => {
    return new Promise( (resolve, reject) => {
        //Hide the request error modal in the api call as the function uses the error response from the api to know if the user is in the channel or not
        let channelInformation =  apiCall(`channel/${channelId}`,'GET',null,null,false); 
        channelInformation.then((response) => { //If the Response of the api is succesfull, then the user is in the channel
            channelPageDiv.replaceChildren();
            let channelNameHeading = document.createElement('h5');
            channelNameHeading.textContent = channelName;
            channelNameHeading.setAttribute('class','text-wrap')
            channelPageDiv.appendChild(channelNameHeading);
            getObjectOfUserDetails(response.members).then((members) => {
                //Edit Channel Section
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
                editChannelModalEditButton.textContent = 'Edit';
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
                            updateChannelNameInNotification(channelId,edittedChannelName);
                            refreshChannelList(channelId,editChannelModal);
                        }
                        
                    }).catch((e) => {})
                })

                editChannelModalFooter.prepend(editChannelModalEditButton);



                //Leave Channel Section
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
                            removeChannelFromNotification(channelId);
                            refreshChannelList(channelId,leaveChannelModal);
                        }
                    }).catch((e) => {})
                })


                //Pinned Messages Section
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

                //Invite to Channel Section
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
                inviteModalInviteButton.textContent = 'Invite';
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
                let channelDescription = channelDetailsSectionGenerator('Channel Description',response.description.length === 0? 'No Description':response.description);
                
                //Populate Channel members in the channel details
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

                sortedMembers.sort((a,b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) {
                        return -1;
                    } else if (a.name.toLowerCase() === b.name.toLowerCase()) {
                        return 0;
                    } else {
                        return 1;
                    }
                
                });

     
                for (let member of sortedMembers){
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
        }).catch((e) => { //If the user is not in channel then just show the channel name and join button
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
                            addJoinedChannelToNotification(channelId);
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
let createChannelButton = document.getElementById('create-channel-button');


//Bind a function that will display the create channel modal that allow the user to create a new channel when clicking the createChannelButton
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
                    displayText: 'Public',
                    attributes: {
                        value: 'public',
                        selected: ''
                    }
                },
                {
                    displayText: 'Private',
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
    createButton.textContent = 'Create Channel';
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


// Fragment Based URL Routing
window.addEventListener('hashchange',() => {
    let mainPage = document.getElementById('main-page');
    if(!mainPage.classList.contains('d-none')){
        let urlFragment = location.hash.split('=');
        if (urlFragment[0] === '#channel'){
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



