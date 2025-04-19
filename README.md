# JSON Configuration Editor

[中文文档](README_CN.md)

A web-based JSON configuration file editor that allows users to create, edit, view, and download JSON configuration files.

## Features

- Create new JSON configuration files
- Edit existing JSON configuration files
- View JSON file contents
- Download JSON files
- Delete JSON files
- Simple password-based authentication for access control

## Tech Stack

- Backend: Go (Gin framework)
- Frontend: HTML, JavaScript
- Database: SQLite for storing file metadata
- Storage: Local file system

## Installation & Running

1. Ensure Go environment is installed
2. Clone the project to your local machine
3. Install dependencies:
   ```bash
   go mod download
   ```
4. Run the project:
   ```bash
   go run main.go
   ```
5. Access `http://localhost:8080` to start using

## Usage Guide

1. Simple password authentication is implemented for accessing the homepage
2. Add `?password=YOUR_PASSWORD` parameter to the URL for access
   - Example: `http://localhost:8080?password=your_password`
3. Main features:
   - Create new file: Click "New" button
   - Edit file: Select file and click "Edit"
   - View file: Select file and click "View"
   - Download file: Select file and click "Download"
   - Delete file: Select file and click "Delete"

## API Endpoints

- `GET /json-api/json` - Get list of all JSON files
- `GET /json-api/json/:filename` - Get content of specified JSON file
- `GET /json-api/json/:filename/download` - Download specified JSON file
- `POST /json-api/json/:filename` - Create new JSON file
- `PUT /json-api/json/:filename` - Update specified JSON file
- `DELETE /json-api/json/:filename` - Delete specified JSON file

## Security Notes

- Simple password-based authentication is implemented for basic access control
- It's recommended to change the default password in production environment
- All file operations have permission verification
- For enhanced security, consider implementing more robust authentication methods in production

## Important Notes

- Ensure sufficient disk space for storing JSON files
- Regular backup of important configuration files is recommended
- Do not use default password in public network environments
- This is a simple implementation for demonstration purposes 