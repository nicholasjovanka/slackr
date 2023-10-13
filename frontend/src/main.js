// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, showWarningModal,movePage,checkEmail, formInputElementValidator, emptyInputValidator,apiCall} from './helpers.js';


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
    .catch((e) => {})
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
            registerEmailWarningDiv.innerHTML = "Wrong Email Format";
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
        registerPasswordWarningDiv.innerHTML = `${registerPagePasswordInput.value.length === 0?'Password':'Confirm Password'} field cannot be empty`
        valid = false;
    } else {
        if(registerPagePasswordInput.value === registerPageConfirmPasswordInput.value) {
            valid = true;
        } else {
            valid = false;
            registerPasswordWarningDiv.innerHTML = "Password must be the same"
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
        openButton.innerHTML = " > ";
    } else {
        channelBar.classList.remove('slide-out');
        channelBar.classList.add('slide-in');
        openButton.innerHTML = " < ";
    }
})




