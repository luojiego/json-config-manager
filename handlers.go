package main

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// listJSONFiles returns all JSON files
func listJSONFiles(c *gin.Context) {
	files, err := getAllJSONFiles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Failed to retrieve JSON files"})
		return
	}
	c.JSON(http.StatusOK, files)
}

// getJSONFile returns a specific JSON file by filename
func getJSONFile(c *gin.Context) {
	filename := c.Param("filename")

	// Check if file exists in database
	_, err := getJSONFileByName(filename)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": true, "message": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error checking file existence"})
		}
		return
	}

	// Read JSON content
	filePath := getJSONFilePath(filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error reading file"})
		return
	}

	// Parse JSON
	var jsonData interface{}
	if err := json.Unmarshal(data, &jsonData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error parsing JSON"})
		return
	}

	c.JSON(http.StatusOK, jsonData)
}

// downloadJSONFile allows downloading a JSON file
func downloadJSONFile(c *gin.Context) {
	filename := c.Param("filename")

	// Check if file exists in database
	_, err := getJSONFileByName(filename)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": true, "message": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error checking file existence"})
		}
		return
	}

	// Read file
	filePath := getJSONFilePath(filename)

	// Set response headers
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/json")

	c.File(filePath)
}

// createJSONFile creates a new JSON file
func createJSONFile(c *gin.Context) {
	filename := c.Param("filename")

	// Check if filename is valid
	if !isValidFilename(filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "Invalid filename"})
		return
	}

	// Ensure .json extension
	if !strings.HasSuffix(filename, ".json") {
		filename += ".json"
	}

	// Check if file already exists
	if _, err := getJSONFileByName(filename); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": true, "message": "File already exists"})
		return
	}

	// Read request body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "Invalid request body"})
		return
	}

	// Validate JSON
	var jsonData interface{}
	if err := json.Unmarshal(body, &jsonData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "Invalid JSON format"})
		return
	}

	// Prettify JSON
	prettyJSON, err := json.MarshalIndent(jsonData, "", "    ")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error formatting JSON"})
		return
	}

	// Write file
	filePath := getJSONFilePath(filename)
	if err := os.WriteFile(filePath, prettyJSON, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error writing file"})
		return
	}

	// Get file info for size
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error getting file info"})
		return
	}

	// Create database record
	file, err := createJSONFileRecord(filename, fileInfo.Size())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error creating database record"})
		return
	}

	c.JSON(http.StatusCreated, file)
}

// updateJSONFile updates an existing JSON file
func updateJSONFile(c *gin.Context) {
	filename := c.Param("filename")

	// Check if file exists
	_, err := getJSONFileByName(filename)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": true, "message": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error checking file existence"})
		}
		return
	}

	// Read request body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "Invalid request body"})
		return
	}

	// Validate JSON
	var jsonData interface{}
	if err := json.Unmarshal(body, &jsonData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": true, "message": "Invalid JSON format"})
		return
	}

	// Prettify JSON
	prettyJSON, err := json.MarshalIndent(jsonData, "", "    ")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error formatting JSON"})
		return
	}

	// Write file
	filePath := getJSONFilePath(filename)
	if err := os.WriteFile(filePath, prettyJSON, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error writing file"})
		return
	}

	// Get file info for size
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error getting file info"})
		return
	}

	// Update database record
	file, err := updateJSONFileRecord(filename, fileInfo.Size())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error updating database record"})
		return
	}

	c.JSON(http.StatusOK, file)
}

// deleteJSONFile deletes a JSON file
func deleteJSONFile(c *gin.Context) {
	filename := c.Param("filename")

	// Check if file exists
	_, err := getJSONFileByName(filename)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": true, "message": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error checking file existence"})
		}
		return
	}

	// Delete file
	filePath := getJSONFilePath(filename)
	if err := os.Remove(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error deleting file"})
		return
	}

	// Delete database record
	if err := deleteJSONFileRecord(filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": true, "message": "Error deleting database record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "File deleted successfully"})
}

// isValidFilename checks if a filename is valid
func isValidFilename(filename string) bool {
	// Remove .json extension if present
	name := strings.TrimSuffix(filename, ".json")

	// Check if name is empty
	if name == "" {
		return false
	}

	// Check if name contains only allowed characters
	for _, char := range name {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char == '_' || char == '-') {
			return false
		}
	}

	return true
}
