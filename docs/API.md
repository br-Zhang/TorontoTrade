# Toronto Trade Web API Documentation

## Authentication API
- Description: Sign up
- Request: `POST /api/signup`
	- Content-type: application/json
	- Body: object
		- username: (string) The username of the user
		- password: (string) The password of the user
- Response: 200
	- Body: User has been signed up
- Response: 400
	- Body: Username/Password is missing
- Response: 409
	- Body: Username already exists
- Response: 500
	- Body: Unable to retrieve users

```
curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/api/signup/
```

- Description: Sign in
- Request: `POST /api/signin`
	- Content-type: application/json
	- Body: object
		- username: (string) The username of the user
		- password: (string) The password of the user
- Response: 200
	- Body: User has been signed up
- Response: 400
	- Body: Username/Password is missing
- Response: 401
	- Body: Invalid username/password
- Response: 500
	- Body: Unable to retrieve users

```
curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/api/signin/
```

- Description: Sign out
- Request: `GET /api/signout`
- Response: 302
	- Body: Redirects to '/'

```
curl -H "Content-Type: application/json" -X GET -b cookie.txt localhost:3000/api/signout/
```
