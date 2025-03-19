

const addNewSourceButton = document.getElementById("upload-source")
const addToButtons = document.getElementsByClassName("btn-add-to")


const addNewSource = () => {
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

const addToCollection = (element) => {
    const collection = document.getElementById("collection-select")
    if (collection.value == "Select you collection") {
        createToast("Select a collection before adding a source")
    } else {
        const url = window.location.pathname.replace("/collections", "/add_source_to_collection")
        let formData = new FormData()
        formData.append("source-id", element.getAttribute("data-id"))
        formData.append("collection-id", collection.value)
        postData(url, formData)
    }
}


addNewSourceButton.addEventListener("click", addNewSource)


for (let button of addToButtons) {
    if (button.getAttribute("data-id") != null) {
        button.addEventListener("click", function(e) {
            addToCollection(e.target)
        })
    }
}