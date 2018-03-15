// jshint esversion: 6
(function(){
	"use strict";

	window.onload = function() {
		function getNextImageId(username, imageId, callback) {
			api.getAllImageIds(username, function (err, imageIds) {
		        var index = imageIds.findIndex(function (elem) {
		            return elem == imageId;
		        });
		        var nextIndex = index + 1;
		        if (nextIndex < imageIds.length) {
		            callback(null, imageIds[nextIndex]);
		        } else {
					callback("No next image", null);
				}
			});
		}

		function getPreviousImageId(username, imageId, callback) {
			api.getAllImageIds(username, function (err, imageIds) {
				var index = imageIds.findIndex(function (elem) {
					return elem == imageId;
				});
				var prevIndex = index - 1;
				if (prevIndex >= 0) {
					callback(null, imageIds[prevIndex]);
				} else {
					callback("No previous image", null);
				}
			});
		}

		function getNextUsername(username, callback) {
			api.getUsernames(function (err, usernames) {
				var index = usernames.findIndex(function (elem) {
					return elem == username;
				});
				var nextIndex = index + 1;
				if (nextIndex < usernames.length) {
					callback(null, usernames[nextIndex]);
				} else {
					callback("No next username", null);
				}
			});
		}

		function getPreviousUsername(username, callback) {
			api.getUsernames(function (err, usernames) {
				var index = usernames.findIndex(function (elem) {
					return elem == username;
				});
				var prevIndex = index - 1;
				if (prevIndex >= 0) {
					callback(null, usernames[prevIndex]);
				} else {
					callback("No previous username", null);
				}
			});
		}

		// Create an image element and adds it to the DOM.
		function drawImage(newImage) {
			// create a new image element
			var element = document.createElement('div');
			element.className = "image-display";
			element.id = "image-" + newImage._id;
			element.innerHTML=`
				<div class="image-icons">
					<div class="previous-image-icon icon"></div>
					<div class="next-image-icon icon"></div>
					<div class="delete-image-icon icon"></div>
				</div>
				<div class="image-content">
					<img class="image" src="/api/images/${newImage._id}/picture/" alt="${newImage.title}" />
					<div class="image-display-title">${newImage.title}</div>
					<div class="image-display-author">${newImage.author}</div>
				</div>
			`;

			element.querySelector('.next-image-icon').addEventListener('click', function() {
				getNextImageId(newImage.author, newImage._id, function (err, nextImageId) {
					if (!err) {
						element.parentNode.removeChild(element);
						drawImageWrapper(nextImageId);
					}
				});
			});

			element.querySelector('.previous-image-icon').addEventListener('click', function() {
				getPreviousImageId(newImage.author, newImage._id, function (err, prevImageId) {
					if (!err) {
						element.parentNode.removeChild(element);
						drawImageWrapper(prevImageId);
					}
				});
			});

			element.querySelector('.delete-image-icon').addEventListener('click', function() {
				api.deleteImage(newImage._id, function (err, image) {
					if (err) {
						console.log(err);
					} else {
						element.parentNode.removeChild(element);
						getNextImageId(newImage.author, newImage._id, function (err, replaceImageId) {
							if (err) {
								getPreviousImageId(newImage.author, newImage._id, function (err, replaceImageId) {
									if (err) {
										// Clear comments
										var commentSection= document.getElementById("comment-section");
										while (commentSection.firstChild) {
											commentSection.removeChild(commentSection.firstChild);
										}
									} else {
										drawImageWrapper(replaceImageId);
									}
								});
							} else {
								drawImageWrapper(replaceImageId);
							}
						});
					}
				});
			});

			// Disable deletion if not image author
			if (api.getCurrentUser() !== newImage.author) {
				// Even if user modifies cookie, app.js will reject if current session user is not author.
				element.querySelector('.delete-image-icon').classList.add('hidden');
			}

			// Remove previous image
			if (document.contains(document.querySelector(".image-display"))) {
				document.querySelector(".image-display").remove();
			}
			// add this element to the document
			document.querySelector("#image-gallery").append(element);

			drawCommentPage(newImage._id, 0);
		}

		function drawImageWrapper(imageId){
			api.getImage(imageId, function (err, image) {
				if (err) {
					console.log(err);
				} else {
					drawImage(image);
				}
			});
		}

		// Create a comment element and adds it to the DOM.
		function drawComment(comment) {
			// create a new comment element
			var element = document.createElement('div');
			element.className = "comment";
			element.id = "comment-" + comment._id;
			element.innerHTML=`
				<div class="comment-header">
					<div class="comment-author">${comment.author}</div>
					<div class="comment-date">${new Date(comment.date).toDateString()}</div>
					<div class="delete-comment-icon icon"></div>
				</div>
				<div class="comment-content">${comment.content}</div>
			`;

			element.querySelector('.delete-comment-icon').addEventListener('click', function() {
				api.deleteComment(comment._id, function (err, comment) {
					if (err) {
						console.log(err);
					} else {
						element.parentNode.removeChild(element);
						var currentPage = document.getElementsByClassName("comment-page")[0].id.substring(5);
						api.getComments(comment.imageId, currentPage, function (err, comments) {
							if (comments.length > 0) {
								drawCommentPage(comment.imageId, currentPage);
							} else {
								drawCommentPage(comment.imageId, currentPage - 1);
							}
						});
					}
				});
			});

			api.getImage(comment.imageId, function(err, image) {
				// Disable deletion if not image/comment author
				if (api.getCurrentUser() !== comment.author && api.getCurrentUser() !== image.author) {
					// Even if user modifies cookie, app.js will reject if current session user is not author.
					element.querySelector('.delete-comment-icon').classList.add('hidden');
				}
			});

			document.getElementsByClassName("comments")[0].append(element);
		}

		// Creates a comment page and adds it to the DOM.
		function drawCommentPage(imageId, page) {
			var element = document.createElement('div');
			element.className = "comment-page";
			element.id = "page-" + page;
			element.innerHTML=`
				<div class="comments-page-title">Comments</div>
				<div class="comments"></div>
				<div class="comment-page-icons">
					<div class="previous-page-icon icon"></div>
					<div class="next-page-icon icon"></div>
				</div>
			`;

			var commentSection= document.getElementById("comment-section");
			while (commentSection.firstChild) {
				commentSection.removeChild(commentSection.firstChild);
			}
			commentSection.append(element);

			element.querySelector('.next-page-icon').addEventListener('click', function() {
				api.getComments(imageId, page + 1, function (err, commentPage) {
					if (commentPage.length > 0) {
						drawCommentPage(imageId, page + 1);
					}
				});
			});

			element.querySelector('.previous-page-icon').addEventListener('click', function() {
				api.getComments(imageId, page - 1, function (err, commentPage) {
					if (commentPage.length > 0) {
						drawCommentPage(imageId, page - 1);
					}
				});
			});

			api.getComments(imageId, page, function (err, commentPage) {
				if (err) {
					console.log(err);
				}
				else {
					for (let comment of commentPage) {
						drawComment(comment);
					}
				}
			});
		}

		// Toggle Add image form
		document.getElementById('toggle-add-image-form').addEventListener('click', function(e) {
			var formElements = document.querySelectorAll("#add-image-form .togglable");
			for (let elem of formElements) {
				if (elem.classList.contains('hidden')) {
					elem.classList.remove('hidden');
				} else {
					elem.classList.add('hidden');
				}
			}

			// Change toggle icon
			var toggleButton = document.querySelector("#toggle-add-image-form");
			if (toggleButton.classList.contains('expand-icon')) {
				toggleButton.classList.remove('expand-icon');
				toggleButton.classList.add('collapse-icon');
			} else {
				toggleButton.classList.remove('collapse-icon');
				toggleButton.classList.add('expand-icon');
			}
		});

		document.getElementById('add-image-form').addEventListener('submit', function(e){
			// prevent from refreshing the page on submit
			e.preventDefault();
			// read form elements
			var imageTitle = document.getElementById("image-title").value;
			var file = document.querySelector('#add-image-form [name="picture"]').files[0];
            api.addImage(imageTitle, file, function(err, image){
                if (err) {
					console.log(err);
				}
                else {
					// clean form
					document.getElementById("add-image-form").reset();
					drawImage(image);
				}
            });
		});

		document.getElementById('add-comment-form').addEventListener('submit', function(e){
			// prevent from refreshing the page on submit
			e.preventDefault();
			// read form elements
			var content = document.getElementById("comment-content").value;
			var imageId = document.getElementsByClassName("image-display")[0].id.substring(6);
			// clean form
			document.getElementById("add-comment-form").reset();
			// create a new comment element
			api.addComment(imageId, content, function (err, comment) {
				drawCommentPage(imageId, 0);
			});
		});

		if (!api.getCurrentUser()){
			document.querySelector('#signin-button').classList.remove('hidden');
		} else {
			document.querySelector('#signout-button').classList.remove('hidden');
			var forms = document.querySelectorAll('form');
			for (let form of forms) {
				form.classList.remove('hidden');
			}
			api.getUsernames(function (err, usernames) {
					if (err) {
						console.log(err);
					} else {

					}
			});
			// Draw the gallery for the current user.
			drawGallery(api.getCurrentUser());
		}

		function drawGallery(username) {
			var imageGallery = document.querySelector("#image-gallery");
			// create a new gallery-header element
			var element = document.createElement('div');
			element.className = "image-gallery-header";
			element.id = "image-gallery-" + username;
			element.innerHTML=`
				<div class="previous-gallery-icon icon"></div>
				<div class="gallery-title">${username}'s Image Gallery</div>
				<div class="next-gallery-icon icon"></div>
			`;
			element.querySelector('.previous-gallery-icon').addEventListener('click', function (e) {
				getPreviousUsername(username, function (err, previousUsername) {
					if (err) {
						console.log(err);
					} else {
						drawGallery(previousUsername);
					}
				});
			});
			element.querySelector('.next-gallery-icon').addEventListener('click', function (e) {
				getNextUsername(username, function (err, nextUsername) {
					if (err) {
						console.log(err);
					} else {
						drawGallery(nextUsername);
					}
				});
			});

			// Add image-gallery-header
			while (imageGallery.firstChild) {
				imageGallery.removeChild(imageGallery.firstChild);
			}
			imageGallery.append(element);

			api.getAllImageIds(username, function(err, imageIds) {
				if (err) {
					console.log(err);
				} else {
					if (imageIds.length > 0) {
						api.getImage(imageIds[0], function(err, image) {
							if (err) console.log(err);
							else drawImage(image);
						});
					}
				}
			});
		}
	};
}());
