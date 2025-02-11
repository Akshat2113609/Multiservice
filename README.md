﻿# Multiservice Blog App

This is a simple blog and comment API built using **Node.js**, **Express**, and **PostgreSQL**. It allows users to create blog posts, add comments, vote on blogs and comments, and view posts and comments with relevant data.

## **Table of Contents**

1. [Project Overview](#project-overview)
2. [Setup Instructions](#setup-instructions)
3. [Deployment Instructions](#deployment-instructions)
4. [API Documentation](#api-documentation)
5. [License](#license)

---

## **Project Overview**

This API allows users to:
- Create, retrieve, and update blog posts.
- Post comments on blog posts.
- Vote on blogs and comments (upvotes and downvotes).
- Fetch the list of comments for a specific blog post.

---

## **Setup Instructions**

### **Prerequisites**
- **Node.js** (v16 or later)
- **PostgreSQL** database
- **Git**

### **Step-by-Step Instructions**

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo-name.git
   cd your-repo-name
2. **Install Dependencies**
```bash
npm install
```
3. ***Configure Environment Variables Create a .env file in the root directory and add the following:***

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
PORT=3000
```
Replace username, password, and your_database_name with your PostgreSQL credentials.

4. ***Set Up the Database Create the required tables by running the SQL script:***
```bash
psql -U username -d your_database_name -f schema.sql
```
(Ensure schema.sql contains all necessary SQL commands to create your tables.)

5.***Start the Server***

```bash
npm start
```
The application will run at http://localhost:3000.

6. ***Test the Endpoints Use tools like Postman or cURL to test the API endpoints.***

## Deployment Instructions
Prerequisites
AWS Elastic Beanstalk or EC2
AWS RDS for PostgreSQL
Step-by-Step Instructions
Set Up the Database

Create an RDS PostgreSQL instance.
1. ***Update the .env file with the RDS connection string:***
```bash
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/your_database_name
```
2.***Prepare the Application for Deployment***

Zip the project files, excluding unnecessary files (e.g., node_modules, .git).
Include a Procfile in the root directory:
```
web: npm start
Deploy to AWS Elastic Beanstalk
```

3.***Log in to the AWS Management Console.***
4.***Create a new Elastic Beanstalk application.***
5.***Upload the zipped project files.***
6.***Configure environment variables in the Elastic Beanstalk console.***
7.***Access the Application***

Once deployed, your app will be available at the URL provided by Elastic Beanstalk.

## API Documentation
1. ***Create a Blog Post***
Endpoint: POST /api/blogs
json
```
{
  "title": "Your Blog Title",
  "content": "Your blog content",
  "userId": "12345"
}
```
Response:
json
```
{
  "id": "1",
  "title": "Your Blog Title",
  "content": "Your blog content",
  "author": "username",
  "upvotes": 0,
  "downvotes": 0,
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00"
}
```
2. ***Get All Blog Posts***
Endpoint: GET /api/blogs
Response:
json
```
[
  {
    "id": "1",
    "title": "Blog 1",
    "content": "Content of Blog 1",
    "author": "username",
    "upvotes": 0,
    "downvotes": 0,
    "score": 0,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```
3. ***Create a Comment***
Endpoint: POST /api/comments
Request Body:
json
```
{
  "content": "Your comment",
  "blogId": "1",
  "userId": "12345"
}
```
Response:
json
```
{
  "id": "1",
  "content": "Your comment",
  "author": "username",
  "upvotes": 0,
  "downvotes": 0,
  "score": 0,
  "created_at": "2025-01-01T00:00:00"
}
```
4. ***Vote on a Blog Post***
Endpoint: POST /api/blogs/:blogId/vote
Request Body:
json
```
{
  "userId": "12345",
  "voteType": "upvote"
}
```
5. Vote on a Comment
Endpoint: POST /api/comments/:commentId/vote
Request Body:
json
```
{
  "userId": "12345",
  "voteType": "downvote"
}
```
## License

### Key Updates:

- The **Deployment Instructions** now include:
  - **Set Up the Database** with instructions for configuring the RDS connection.
  - **Preparing the Application for Deployment**, including zipping the project and creating the `Procfile`.
  - **Deploying to AWS Elastic Beanstalk**, with detailed steps for logging in to the AWS Console, creating an application, uploading the zipped project files, and configuring environment variables.
  - **Accessing the Application** once deployed through Elastic Beanstalk.

This structure should give a clear, detailed guide on how to deploy your application to AWS Elastic Beanstalk. Let me know if you need further adjustments!


