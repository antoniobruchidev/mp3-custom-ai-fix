## Testing local environment
In two different shells:
 - ```bash
    python app.py
    ```
    ![Local app](custom_assistant/static/readme/local_app.png)
 - ```bash
    celery -A custom_assistant.tasks worker --loglevel=INFO
    ```
    ![Local celery](custom_assistant/static/readme/local_celery.png)

I used Postman to test the routes and see if everything it's working:
 - Test add route. It should return a unique id for the task processing in background.
    ![Test add route](custom_assistant/static/readme/test_add_route.png)
 - Test task_result route. It should return the status and result for a given task id
    ![Test task_result route](custom_assistant/static/readme/test_task_result_route.png)
 - Test chat route. It should return a small poem about Juventus not doing so well. Sigh!
    ![Test chat route](custom_assistant/static/readme/test_chat_route.png)
 - Test 404 route. It should return a dict with status 404 and page not found.
    ![Test 404 route](custom_assistant/static/readme/test_404_route.png)