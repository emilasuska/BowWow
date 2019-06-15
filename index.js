var filter = "";
var filterNormalized = "";
var breeds = [];
var images = [];
var numberOfImages = 6;

$(document).ready(function() {
    // get query parameters (if any)
    filter = getQueryParameter("filter") || "";
    images = JSON.parse(getQueryParameter("images") || "[]");

    // configure callbacks
    $("#filter").on("change", function() {
        filter = $("#filter").val();
        refresh();
    });
    $("#filterButton").on("click", function() {
        filter = $("#filter").val();
        refresh();
    });
    $(document).ajaxStart(function() {
        $("#busy").show();
    });
    $(document).ajaxComplete(function() {
        $("#busy").hide();
    });

    // set filter
    filterNormalized = filter.trim().toLowerCase();
    $("#filter").val(filter);

    resize();
    addAllImages();
    getAllBreeds();
});

$(window).resize(resize);

function resize() {
    // adjust the heights of the two vertical panes
    $("#breeds").height(window.innerHeight - 240);
    $("#images").height(window.innerHeight - 240);
}

function refresh() {
    // reload this page with updated query parameters
    window.location = "index.html"
        + "?filter=" + encodeURIComponent(filter)
        + "&images=" + encodeURIComponent(JSON.stringify(images));
}

function getAllBreeds() {
    // Dog API - get all breeds
    $.ajax({
        type: 'GET',
        url: "https://dog.ceo/api/breeds/list/all",
        dataType: 'json',
        crossDomain: true,
        success: function(response) {
            // remove any existing breeds/sub-breeds
            breeds = [];
            $("#breeds").empty();

            // add all breeds and sub-breed to the list
            $.each(response.message, function(breed, subBreeds) {
                addBreed(breed, null, subBreeds);
                $.each(subBreeds, function(i, subBreed) {
                    addBreed(breed, subBreed);
                });
            });

            if (breeds.length <= 0) {
                $("#noMatchesError").show();
                return;
            }

            // add more images (if needed)
            getMoreImages();
        },
        error: function() {
            $("#getBreedsError").show();
        }
    });
}

function getMoreImages() {
    // keep adding images until we have enough
    if (images.length < numberOfImages) {
        // pick a breed/sub-breed at random
        var randomBreed = breeds[Math.floor(Math.random() * breeds.length)];

        // Dog API - get a random image of the breed/sub-breed
        $.ajax({
            type: 'GET',
            url: "https://dog.ceo/api/breed/" + randomBreed + "/images/random",
            dataType: 'json',
            crossDomain: true,
            success: function(response) {
                addImage(response.message);

                if (images.length < numberOfImages) {
                    // still need more images
                    getMoreImages();
                } else {
                    // this is the last image - update url with new query parameters
                    refresh();
                }
            },
            error: function() {
                $("#getImageError").show();
            }
        });
    }
}

function addBreed(breed, subBreed, allSubBreeds = []) {
    var name = breed;
    if (subBreed) {
        name += "/" + subBreed;
    }

    // check if the breed or sub-breed(s) match the filter
    var matches = name.includes(filterNormalized);
    $.each(allSubBreeds, function(i, subBreed) {
        matches = matches || subBreed.includes(filterNormalized);
    });

    if (!matches) {
        // breed doesn't match filter - ignore it
        return;
    }

    var item = $("<li>")
        .text(subBreed || breed)
        .addClass(subBreed ? "subBreed" : "breed");

    breeds.push(name);
    $("#breeds").append(item);
}

function addImage(image) {
    var name = image.split("/")[4].split("-").join("/");
    var matches = name.includes(filterNormalized);

    if (!matches) {
        // image doesn't match filter - ignore it
        return;
    }

    // image with label and close button
    var item = $("<div>")
        .append($("<img>").attr("src", image))
        .append($("<label>").text(name))
        .append($("<button>")
            .text("❌")
            .on("click", function() {
                // remove this image
                var newImages = [];
                $.each(images, function(i, name) {
                    if (name != image) {
                        newImages.push(name);
                    }
                });
                images = newImages;

                // update url with new query parameters
                refresh();
            })
        );

    images.push(image);
    $("#images").append(item);
}

function addAllImages() {
    var allImages = images;

    // remove any existing images
    images = [];
    $("#images").empty();

    $.each(allImages, function(i, image) {
        addImage(image);
    })
}
