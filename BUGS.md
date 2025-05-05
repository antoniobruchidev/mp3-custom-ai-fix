## BUGS

### Heroku out of memory
![Heroku out of memory](custom_assistant/static/images/heroku_out_of_memory.png)

I had a problem with the import and the worker was loading all the app.... Created the worker own module.

### Missing Migration
![Missing migration](custom_assistant/static/images/missing_migration.png)

Stupid mistake, but when you forget adding a field and everything stop working....

```bash
flask db migrate -m "commit"
flask db upgrade
```

### PendingRollback
![PendingRollback](custom_assistant/static/images/rollback.png)

```python
except PendingRollbackError:
    db.session.rollback()
    db.session.close()
```

### Streaming error
![Streaming error](custom_assistant/static/images/streaming_error.png)

Added disable_streaming=True to the ChatOllama instance

### Homepage carousel
On mobile is not responsive and it looks awful, but i don't have any more time so I'll leave it as it is.

### Sometimes logs user out
Not yet found reason.

### Long wait when sending a message
Added a spinner to the sends message button and disabling it until data is fetched.

### Not saving tables and images when extracting pdfs
In storage.py I was checking for "jpg" <code>not in ALLOWED_EXTENSION</code>
Removed the not.

### Playground not saving assistant
Broke the page when I created the assistant page and I used the same route assistants/create to edit an existing assistant adding a conditional statement. Fixed adding <code>"edit": false</code> in the payload.

### Assistants page not sending messages
Not sure when I broke the page, probably while trying to clean up and made a mess...
I was trying to append as DOM children the messages element to chatHistory (array type)
Fixed by declaring the DOM element to which append the message elements and adding the elements to it.

### Assistant page not saving the chat history
In the function saveHistory in assistants.js I wrote the conditional statement for chat_history instead of chatHistory. Fixed the typo.

### Proprietary server down issue
When proprietary server is down the timestamp created in backup_server_switch is in ISO format and cannot be > than 0. Fixed by setting it to None when the proprietary hardware is up, and checking only if it exists in the template.