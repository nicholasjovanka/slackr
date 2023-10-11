import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, showWarningModal,movePage,checkEmail, formInputElementValidator, emptyInputValidator } from './helpers.js';


console.log('Let\'s go!');


//Login page
let loginPageRegisterButton = document.getElementById('login-page-register-button');

loginPageRegisterButton.addEventListener('click', (e) => {
    movePage('login-page', 'register-page');
})




//Register Page

let registerNameInput = document.getElementById('register-name-input');

const validateRegisterPageNameInput = () => {
    let registerNameWarningDiv = document.getElementById('register-name-invalid-message');
    emptyInputValidator(registerNameInput,registerNameWarningDiv,"Name");
}

registerNameInput.addEventListener('blur', (e) => {
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

let registerPasswordInput = document.getElementById('register-password-input');
let registerConfirmPasswordInput = document.getElementById('register-confirm-password-input');

const validateRegisterPagePasswordInput = () => {
    let registerPasswordWarningDiv = document.getElementById('register-password-invalid-message');
    let valid = true;
    if(registerPasswordInput.value.length === 0 || registerConfirmPasswordInput.value.length === 0){
        registerPasswordWarningDiv.innerHTML = `${registerPasswordInput.value.length === 0?'Password':'Confirm Password'} field cannot be empty`
        valid = false;
    } else {
        if(registerPasswordInput.value === registerConfirmPasswordInput.value) {
            valid = true;
        } else {
            valid = false;
            registerPasswordWarningDiv.innerHTML = "Password must be the same"
        }
    }
    formInputElementValidator(registerPasswordInput, valid);
    formInputElementValidator(registerConfirmPasswordInput, valid);

}

registerPasswordInput.addEventListener('blur', (e) => {
    validateRegisterPagePasswordInput();
})

registerConfirmPasswordInput.addEventListener('blur', (e) => {
    validateRegisterPagePasswordInput();
})


let registerPageLoginHyperLink = document.getElementById('register-page-a-element');

registerPageLoginHyperLink.addEventListener('click', (e) => {
    e.preventDefault();
    movePage('register-page','login-page');
})


let registerPageButton = document.getElementById('register-page-submit-button');
registerPageButton.addEventListener('click', (e) => {
    validateRegisterPageNameInput();
    validateRegisterPageEmailInput();
    validateRegisterPagePasswordInput();
    // e.preventDefault();
    // showWarningModal('Error','SOMETHING');
})







let loginForm = document.getElementById('registration-form');

loginForm.addEventListener('submit',(e) => {
    e.preventDefault();
    e.stopPropagation();
}, false)