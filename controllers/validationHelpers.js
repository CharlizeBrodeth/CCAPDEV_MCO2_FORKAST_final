function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((([0-9]{1,3}\.{0,1}){4})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/g;
    return password.length >= 8 && hasSpecialChar.test(password);
}

function allFieldsProvided(body, fields) {
    return fields.every(field => body.hasOwnProperty(field) && body[field]);
}

module.exports = {
    validateEmail,
    validatePassword,
    allFieldsProvided
};