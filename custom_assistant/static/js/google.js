
function handleCredentialResponse(response) {
    const responsePayload = decodeJwtResponse(response.credential);
    loginOrRegister(responsePayload.sub, responsePayload.email)
}

function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

const loginOrRegister = async (googleId, email) => {
    const form = document.getElementById("credential-form")
    const formData = new FormData(form)
    formData.set("email", email)
    formData.append("google-id", googleId)
    let url = null
    if (window.location.pathname.includes("/login")){
        url = window.location.pathname
    } else {
        url = window.location.pathname.replace("/register", "/login")
    }
    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        })
        const data = await response.json();
        if (data.status == 200) {
            window.location.href = url.replace("/login", "/");
        } else {
            console.log(data.message, data.status)
        }
      } catch (e) {
            console.error(e);
      }
}

const loginRegisterButton = document.getElementById("register-login-link")

loginRegisterButton.addEventListener("click", function() {
    const url = loginRegisterButton.getAttribute("data-url");
    window.location.href = url;   
})