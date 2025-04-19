package main

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

// initDB initializes the database connection
func initDB() error {
	var err error

	// Create database directory if it doesn't exist
	if err = os.MkdirAll("./data", 0755); err != nil {
		return err
	}

	// Open SQLite database
	db, err = sql.Open("sqlite3", "./data/jsoneditor.db")
	if err != nil {
		return err
	}

	// Create tables if they don't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS json_files (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		filename TEXT NOT NULL UNIQUE,
		modified_time DATETIME DEFAULT CURRENT_TIMESTAMP,
		size INTEGER DEFAULT 0
	);
	`

	_, err = db.Exec(createTableSQL)
	return err
}

// initJSONStorage creates the directory to store JSON files
func initJSONStorage() error {
	return os.MkdirAll("./data/json", 0755)
}

// JSONFile represents a JSON file in the database
type JSONFile struct {
	ID           int64  `json:"id"`
	Filename     string `json:"filename"`
	ModifiedTime string `json:"modified_time"`
	Size         int64  `json:"size"`
}

// getAllJSONFiles retrieves all JSON files from the database
func getAllJSONFiles() ([]JSONFile, error) {
	rows, err := db.Query("SELECT id, filename, modified_time, size FROM json_files ORDER BY modified_time DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []JSONFile
	for rows.Next() {
		var file JSONFile
		if err := rows.Scan(&file.ID, &file.Filename, &file.ModifiedTime, &file.Size); err != nil {
			return nil, err
		}
		files = append(files, file)
	}

	return files, nil
}

// getJSONFileByID retrieves a JSON file by its ID
func getJSONFileByID(id int64) (*JSONFile, error) {
	var file JSONFile
	err := db.QueryRow("SELECT id, filename, modified_time, size FROM json_files WHERE id = ?", id).
		Scan(&file.ID, &file.Filename, &file.ModifiedTime, &file.Size)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, os.ErrNotExist
		}
		return nil, err
	}
	return &file, nil
}

// getJSONFileByName retrieves a JSON file by its filename
func getJSONFileByName(filename string) (*JSONFile, error) {
	var file JSONFile
	err := db.QueryRow("SELECT id, filename, modified_time, size FROM json_files WHERE filename = ?", filename).
		Scan(&file.ID, &file.Filename, &file.ModifiedTime, &file.Size)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, os.ErrNotExist
		}
		return nil, err
	}
	return &file, nil
}

// createJSONFileRecord creates a new JSON file record in the database
func createJSONFileRecord(filename string, size int64) (*JSONFile, error) {
	result, err := db.Exec(
		"INSERT INTO json_files (filename, modified_time, size) VALUES (?, CURRENT_TIMESTAMP, ?)",
		filename, size,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return getJSONFileByID(id)
}

// updateJSONFileRecord updates an existing JSON file record in the database
func updateJSONFileRecord(filename string, size int64) (*JSONFile, error) {
	_, err := db.Exec(
		"UPDATE json_files SET modified_time = CURRENT_TIMESTAMP, size = ? WHERE filename = ?",
		size, filename,
	)
	if err != nil {
		return nil, err
	}

	return getJSONFileByName(filename)
}

// deleteJSONFileRecord deletes a JSON file record from the database
func deleteJSONFileRecord(filename string) error {
	_, err := db.Exec("DELETE FROM json_files WHERE filename = ?", filename)
	return err
}

// getJSONFilePath returns the full path to a JSON file
func getJSONFilePath(filename string) string {
	return filepath.Join("./data/json", filename)
}
