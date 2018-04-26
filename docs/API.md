# Toronto Trade Web API Documentation

## Authentication API

Sign up as a new user.
- Request: `POST /api/signup`
	- Content-type: application/json
	- Body: object
		- username: (string) The username of the user
		- password: (string) The password of the user
		- email: (string) The email of the user
- Response: 200
	- Successful sign up
	- Body: User has been signed up.
- Response: 400
	- Password field is missing
	- Body: Password is missing.
- Response: 400
	- Username field is missing
	- Body: Username is missing.
- Response: 409
	- The username was already taken
	- Body: Username already exists.
- Response: 500
	- Body: Unable to retrieve users.

```
curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice","email":"abc@gmail.com"}' -c cookie.txt localhost:3000/api/signup/
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
	- Successful listing creation.
	- Body: object
		- _id: (ObjectID) The ObjectID of the listing
		- title: (string) The title of the listing
		- price: (string) The price of the listing
		- category: (string) The category of the listing
		- description: (string) The description of the listing
		- updated: (Date) The date the listing was created
		- image_url: (string) The URL of the listing image
		- image_id: (string) The public_id of the listing image (on Cloudinary)
		- userId: (ObjectID) The ObjectID of the user that created the listing
- Response: 500
	- An error occurred trying to save the listing to the database.
	- Body: Unable to create listing

```
curl -X POST -F "picture=@picture.jpg" -F "title=ListingTitle" -F "price=9001" -F "category=PersonalCare" -F "description=This" -b cookie.txt localhost:3000/api/listings/
```

Retrieve an existing listing.
- Request `GET /api/listings/:id
	- URL parameters:
		- id: (ObjectID) The _id of the listing to retrieve

```
curl -X GET -b cookie.txt localhost:3000/api/listings/aValidId
```

Retrieve the latest listings.
- Request `GET /api/listings/
	- Query paramters:
		- limit: (integer) The maximum number of listings to retrieve. By default, this is set to fifty.
		- offset: (integer) The offset to start retrieving from (starting at index zero). By default, this is set to zero.

```
curl -X GET -b cookie.txt 'localhost:3000/api/listings/?limit=50&offset=0'
```

Update an existing listing.

```
curl -X PUT -F "picture=@picture.jpg" -F "title=ListingTitleEditted" -F "price=9001" -F "category=PersonalCare" -F "description=This" -b cookie.txt localhost:3000/api/listings/5aad89e2eacac7319c4f8492
```

Delete an existing listing.
- Request `DELETE /api/listings/:id`
	- URL parameters:
		- id: (ObjectID) The _id of the listing to delete
- Response: 200
	- Successful listing deletion.
	- Body: object
		- _id: (ObjectID) The _id of the deleted listing
- Response: 404
	- The listing couldn't be found.
	- Body: No listing with id exists.

```
curl -X DELETE -b cookie.txt localhost:3000/api/listings/5aac7c62cbe30d18f82bdf02
```
