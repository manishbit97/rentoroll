# RentoRoll Backend

This is the backend service for the RentoRoll project, written in Go.

## Project Structure

```
RentoRoll/
├── backend/
│   ├── cmd/
│   │   └── rentoroll/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── go.mod
│   ├── go.sum
│   └── README.md
```

## Prerequisites

- Go 1.16 or higher
- Git

## Setup

1. **Clone the repository:**

    ```sh
    git clone https://github.com/yourusername/rentoroll.git
    cd rentoroll/backend
    ```

2. **Install dependencies:**

    ```sh
    go mod tidy
    ```

2. **Initial Setup:**

  ```sh
    go build -o db-setup initialsetup.go
    DATABASE=rentoroll ./db-setup 
    ```

3. **Run the application:**

    ```sh
    go run .
    ```

## Project Modules

- **cmd/rentoroll**: Entry point of the application.
- **pkg/config**: Configuration management.
- **pkg/models**: Data models.
- **pkg/routes**: API routes.
- **pkg/utils**: Utility functions.

## Initi


## License

This project is licensed under the MIT License.