# EvalMate: Peer Evaluation Web Application

EvalMate is a web application designed to simplify the peer evaluation process for any group or individual involved in collaborative work.

## Description

For teams and individuals engaged in collaborative projects, EvalMate provides a platform to conduct peer evaluations seamlessly. The application allows users to:

*   **Create Custom Evaluations:** Build your own evaluation forms from scratch with questions tailored to your specific project or team dynamics.
*   **Use Templates:** Get started quickly by using pre-built evaluation templates with standard questions.
*   **Manage Evaluations:** Easily distribute, collect, and review evaluations.

Whether you are a student group, a professional team, or any other collaborative unit, EvalMate helps you gather valuable feedback to improve teamwork and project outcomes.

## Features

*   User registration and login
*   Create, manage, and share evaluations.
*   Option to create evaluations from scratch or use existing templates.

## Project Structure

```
EvalMate/
├── EvalMate/           # Django project folder
│   ├── settings.py     # Project settings
│   ├── urls.py         # Project-level URL routing
│   └── ...
├── EvalMateApp/        # Django app folder
│   ├── models.py       # Database models
│   ├── views.py        # Application views
│   ├── urls.py         # App-level URL routing
│   └── ...
├── static/             # Static files (CSS, JS, images)
└── templates/          # HTML templates
```

## Built With

*   [Django](https://www.djangoproject.com/) - The web framework used
*   [PostgreSQL](https://www.postgresql.org/) - Database
