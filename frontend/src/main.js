// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, showWarningModal,movePage,checkEmail, formInputElementValidator, emptyInputValidator,apiCall, getAllChannels, createBasicModalStructure, createForm, getChannelDetails, refreshChannelContent} from './helpers.js';


console.log('Let\'s go!');

// window.addEventListener('resize', (e) => {
//     console.log(window.innerWidth);
// });

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




//Register Page
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

//Main page
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



localStorage.setItem('token', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTQ0NiIsImlhdCI6MTY5NzM1NDg3NX0.ujbOdP_Zdc3AF-u3mQo0CH7hKIx_-cYXcADdSeF0C5A')
localStorage.setItem('userId', '99446');


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
            refreshChannelContent(`${response.channelId}`,myModal)
        });
    })
    modalFooter.prepend(createButton);
    myModal.show();
    console.log(modal.children);
})

getAllChannels().catch((e) => {});

