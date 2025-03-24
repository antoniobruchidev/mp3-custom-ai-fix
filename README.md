# Custom AI

## Concept
The idea is to let each user create and share if they want, their own AI assistant, each with different personalities and trait affecting their characters.
To be able to do this I'll have to work with "abliterated" models (more later), so we'll make sure users won't incur in using one public but "unsafe" model capable of talking about difficult topics, we will label them as NSFW.

![Concept](custom_assistant/static/readme/concept.png)

Altough at the end I did not let user shares their assistant, in the future they will be able to share their collections.

## UX
The platform targets any person who wants to play with a completely unrestrictred and customizable AI chatbot.
The application is designed to distinguish its users in:
 - UNREGISTERED USERS: They will be able to chat with anything they create in the playground by mixing base prompt and character traits without being able to save.
 - REGISTERED USERS: They will be able to create, modify, save their own assistants, their character traits and their chat histories.

[MODEL USED](https://huggingface.co/DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF)

### User Stories
 - As an UNREGISTERED USER I'd like to be able to try the platform.
 - As an UNREGISTERED USER I'd like to be able to register easily.
 - As a REGISTERED USER I'd like to create unique assistants.
 - As a REGISTERED USER I'd like to be able to modify my assistants.
 - As a REGISTERED USER I'd like to be able to save my chat histories.
 - As a REGISTERED USER I'd like to be able to upload documents.
 - As a REGISTERED USER I'd like to be able to chat with my documents.
 - As a REGISTERED USER I'd like to be able to delete my assistants and/or my account.

### Strategy
The goal of this project is to create a fully customizable assistant with a definite personality created assembling a base prompt and character traits choosen by the user.
Users will also be able to ingest their pdf and create collections to query with the help a Large Language Model

### Scope
The platform is designed to allow users to create different ai chatbots "playing" with the chatbot system prompt finding the perfect mix that suits them. In addition users can upload their documents and consult them without having to look for, users will just ask.

### Skeleton
The platform has a neat navigation with a navbar ad the top and the login/account button at the top right. All the layouts are cards stacked on top in the center, or displayed in a responsive grid.

### Surface
The platform will be accessible by any device, including mobiles.
The platforms color are in a relaxing tonality of blue with no contrast problems.

## V1 Features
 - Fully customizable AI chatbot/assistant
 - RAG from users documents

## Future Features
 - RAG from public collections created crawling sitemap.xml of documentations websites, converting in markdown and ingesting in collections [EXAMPLE XML TO FEED THE CRAwLER WITH](https://docs.djangoproject.com/sitemap-it.xml)
 - RAG from shared knowledge among users
 - Shareable Flows and Agents

## Development

### Local Machine
Intel Core i7 13700k 32GB DDR5 - RX7800XT 16GB
Ubuntu 22.04.05.

#### Python Environment
 - pyenv 2.5.3 - [How to install pyenv on Ubuntu 22.04](https://ericsysmin.com/2024/01/11/how-to-install-pyenv-on-ubuntu-22-04/)
 - python 3.11.9
 - celery

#### Inference Environment
 - ROCM 6.3.4
```bash
sudo apt update
wget https://repo.radeon.com/amdgpu-install/6.3.4/ubuntu/jammy/amdgpu-install_6.3.60304-1_all.deb
sudo apt install ./amdgpu-install_6.3.60304-1_all.deb
sudo amdgpu-install -y --usecase=graphics,rocm
sudo usermod -a -G render,video $LOGNAME
echo "export HSA_OVERRIDE_GFX_VERSION=11.0.0" >> .profile
```
Followed [this](https://discuss.linuxcontainers.org/t/rocm-and-pytorch-on-amd-apu-or-gpu-ai/19743) tutorial with no incus but with up to date drivers (released 6th March 2025)
 - ollama - [Download Ollama](https://ollama.com/download)

#### Local Redis Server for background tasks
 - [REDIS SERVER](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/install-redis-on-linux/)

#### User Authentication
The user can authenticate via google or with email and password.
Using google will not require verification process.

#### Playground
The user can send a message even without setting prompr or leaving the message empty. The add traits process with the modal is pretty straightforward.
The clear button will remove active traits. Clicking on the active trait shows the value. Toast notifies the token usage or errors. Logging in with a user will make appear save assistant button which will save any active traits not already saved and a new assistant.
In the playground the Large Language Model generates without a chat history, meaning every message sent will be his first.

#### Assistants
Similar to the playground page but we have a select with the saved assistants which will fetch their data on select, javascript will take care of building the active traits set the prompt, switch the clear button with a delete, disable the save button and make appear a edit one. Editing will enable the inputs and the save button bringing back the clear button and having disappear the delete one. Clearing will reset the inputs as the last assistant used, while saving will do that on top. Clicking on manage traits will bring to life an offcanvas from which the user can manage the saved traits. Saved traits inputs start as disabled but once clicked edit it will stay editable until refresh, that was a safety measure for the assistants record which each share the same input elements. Adding a new trait only adds a new trait, it doesn't connect it to any assistants. Delete button will delete and add to active assistant will add the selected trait to the assistant or return an error.
At the bottom of the page the user can save the chat history giving it a name, or it will default to SAVED CHAT.

#### Chat histories
The user can find all the chat histories truncated to the last exchange, with buttons to go to the selected chat_history or to delete. Delete will trigger a modal for confirmation.

#### Chat history
It recreates the chat from the start.

#### Collections
Similar to assistants page there is a selector that lets the user choose the collection he wants to query/manage.
The same offcanvas with sources let the user upload a pdf that later will be ingested by clicking on add to active collection that will return an error if no collections are selected or it will start the ingestion in background with a celery worker.


## Deployment

### Heroku

 - requirements.txt
From command line:
```bash
pip install pip-tools
pip-compile requirements/requirements.in -o requirements.txt
```
The created requirements.txt file will tell the heroku platform which packages to install.

- Procfile
   Create a new file named Procfile with the following code in it
```bash
web: gunicorn app:app
worker: celery -A custom_assistant.tasks worker --loglevel=INFO
```
It will tell the heroku platform to launch the web application and the celery worker to run background tasks.

- .python-version
Create a file named .python-version with the python version the app is using.
```bash
3.11
```
It will tell the heroku platform which python version to use.

Deployment process is now pretty straightforward. Login on Heroku, go to the application deploy tab, follow the cli instructions or connect the app to the github repo. Click deploy branch and set env variables.

```bash
heroku log --app app-name --tail
```
to read the app logging from the heroku server.

## [TESTING](TESTING.md)

## [DATABASE](DATABASE.md)

## [BUGS](BUGS.md)



