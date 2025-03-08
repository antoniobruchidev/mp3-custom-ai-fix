# Custom AI

## UX
The platform targets any person who wants to play with a completely unrestrictred AI chatbot in a safe environment.
The application is designed to distinguish its users in:
 - UNREGISTERED USERS: They will be able to chat with a safe model.
 - REGISTERED USERS: They will be able to create, modify, save their own assistants, using a "character trait" system in combination with a base prompt.
Registered users will also be able to save their chat history.

[REGISTERED USERS MODEL](https://huggingface.co/DavidAU/Llama-3.2-8X4B-MOE-V2-Dark-Champion-Instruct-uncensored-abliterated-21B-GGUF)

[UNREGISTERED USERS MODEL](https://ollama.com/library/llama3.2:1b)

## Concept
The idea is to let each user create and share if they want, their own AI assistant, each with different personalities and trait affecting their characters.
To be able to do this I'll have to work with "abliterated" models (more later), so we'll make sure users won't incur in using one public but "unsafe" model capable of talking about difficult topics, we will label them as NSFW.

![Concept](custom_assistant/static/readme/concept.png)

## V1 Features
 - Fully customizable AI chatbot/assistant 

## Future Features
 - RAG from shared knowledge among users
 - Shareable Flows

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
