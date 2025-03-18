

const addNewSource = async () => {
    const form = document.getElementById("source-form")
    const formData = new FormData(form)
    const name = formData.get("source-name")
    let error = null
    if (name.length > 16) {
        error = `Name field must be 16 character or less. Characters: ${name.length}`
    } else if (name == "") {
        error = "Name field cannot be empty"
    }
    const description = formData.get("description")
    if (description.length > 255) {
        error = `Description field must be 255 character or less. Characters: ${description.length}`
    }
    if (error != null) {
        createToast(error)
    } else {
        const url = window.location.pathname.replace("/collections", "sources/create")
        postData(url, formData)
    }
}

const addNewSourceButton = document.getElementById("upload-source")

addNewSourceButton.addEventListener("click", addNewSource)
