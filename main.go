package main

import (
	"log"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database and storage
	if err := initDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Create JSON storage directory if it doesn't exist
	if err := initJSONStorage(); err != nil {
		log.Fatal("Failed to initialize JSON storage:", err)
	}

	// Create a Gin server
	router := gin.Default()

	// Static files
	router.Static("/dist", "./static/dist")
	router.Static("/plugins", "./static/plugins")
	router.Static("/js", "./static/js")
	// router.StaticFile("/index.html", "./static/index.html")
	// router.StaticFile("/", "./static/index.html")

	// Define a complex password for authentication
	const complexPassword = "S3cur3P@ssw0rd"

	// Handle root and index.html routes with authentication
	router.GET("/", func(c *gin.Context) {
		password := c.Query("password")
		if password != complexPassword {
			c.String(403, "Access denied: Invalid authentication credentials")
			return
		}
		c.File("./static/index.html")
	})

	router.GET("/index.html", func(c *gin.Context) {
		password := c.Query("password")
		if password != complexPassword {
			c.String(403, "Access denied: Invalid authentication credentials")
			return
		}
		c.File("./static/index.html")
	})

	// Set up API routes
	setupRoutes(router)

	// Start the server
	log.Println("Starting server on :8080")
	router.Run(":8080")
}

// setupRoutes configures all routes
func setupRoutes(router *gin.Engine) {
	// API routes for JSON files
	api := router.Group("/json-api")
	{
		json := api.Group("/json")
		{
			json.GET("", listJSONFiles)
			json.GET("/:filename", getJSONFile)
			json.GET("/:filename/download", downloadJSONFile)
			json.POST("/:filename", createJSONFile)
			json.PUT("/:filename", updateJSONFile)
			json.DELETE("/:filename", deleteJSONFile)
		}
	}
}

// Helper function to handle relative file paths
func resolveFilePath(path string) string {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return path
	}
	return absPath
}
