# Toronto Trade Web API Documentation

## Authentication API

Sign up as a new user.
- Request: `POST /api/signup`
	- Content-type: application/json
	- Body: object
		- username: (string) The username of the user
		- password: (string) The password of the user
- Response: 200
	- Successful sign up
	- Body: User has been signed up.
- Response: 400
	- One of either username/password fields were missing
	- Body: Username/Password is missing.
- Response: 409
	- The username was already taken
	- Body: Username already exists.
- Response: 500
	- Body: Unable to retrieve users.

```
curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/api/signup/
```

Sign in as an existing user.
- Request: `POST /api/signin`
	- Content-type: application/json
	- Body: object
		- username: (string) The username of the user
		- password: (string) The password of the user
- Response: 200
	- Successful sign in.
	- Body: User has been signed in.
- Response: 400
	- One of either username/password fields were missing
	- Body: Username/Password is missing.
- Response: 401
	- Body: Invalid username/password.
- Response: 500
	- Body: Unable to retrieve users.

```
curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/api/signin/
```

- Description: Sign out
- Request: `GET /api/signout/`
- Response: 302
	- Successful sign out.
	- Body: Redirects to '/'

```
curl -H "Content-Type: application/json" -X GET -b cookie.txt localhost:3000/api/signout/
```

## Listing API

Create a new listing.
- Request: `POST /api/listings`
	- Content-type: multipart/form-data
	- Body: object
		- title: (string) The title of the listing
		- price: (string) The price of the listing
		- category: (string) The category of the listing
		- description: (string) The description of the listing
		- picture: (file) The picture of the listing
- Response: 200
	- Body: object
		- _id: (string) The ObjectID of the listing
		- title: (string) The title of the listing
		- price: (string) The price of the listing
		- category: (string) The category of the listing
		- description: (string) The description of the listing
		- updated: (Date) The date the listing was created
		- image_url (string) The URL of the listing image
		- image_id (string) The public_id of the listing image (on Cloudinary)
- Response: 500
	- An error occurred trying to save the listing to the database.
	- Body: Unable to create listing

```
curl -X POST -F "picture=@path\to\file" -F "title=ListingTitle" -F "price=9001" -F "category=PersonalCare" -F "description=This" -b cookie.txt localhost:3000/api/listings/
```

Retrieve an existing listing.

```
curl -H "Content-Type: application/json" -X GET -b cookie.txt localhost:3000/api/listings/5aac370155218c18401c82cc
```
