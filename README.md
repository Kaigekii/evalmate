# EvalMate: Peer Evaluation Web Application

EvalMate is a web application designed to simplify the peer evaluation process for any group or individual involved in collaborative work. It allows users to create custom evaluations or use templates to gather feedback and improve team collaboration.

## Features

*   **User Authentication:** Secure user registration and login.

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

## Tech Stack

*   **Backend:** Django
*   **Database:** PostgreSQL
*   **Frontend:** HTML, CSS, JavaScript

## Setup & Run Instructions

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

*   Python 3.x
*   pip (Python package installer)
*   PostgreSQL

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd EvalMateProject
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    *(A `requirements.txt` file should be created for the project. You can create one with `pip freeze > requirements.txt`)*
    ```bash
    pip install -r requirements.txt
    ```

### Database Setup

1.  Ensure your PostgreSQL server is running.
2.  Update the `DATABASES` configuration in [`EvalMate/EvalMate/settings.py`](EvalMate/EvalMate/settings.py:76) with your database credentials.

### Running the Application

1.  **Apply database migrations:**
    ```bash
    python EvalMate/manage.py migrate
    ```

2.  **Start the development server:**
    ```bash
    python EvalMate/manage.py runserver
    ```

3.  Open your browser and navigate to `http://127.0.0.1:8000/`.

## Team Members

| Name                | Role              | CIT-U Email                           |
| ------------------- | ----------------- | ------------------------------------- |
| Johndaniel Canonigo | Lead Developer    | johndaniel.canonigo@cit.edu           |
| John Aaron Cañadilla| Frontend Developer| johnaaron.cañadilla@cit.edu         |
| Mark Anton Camoro   | Backend Developer | markanton.camoro@cit.edu              |
