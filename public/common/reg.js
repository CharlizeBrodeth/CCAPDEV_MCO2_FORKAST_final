$(document).ready(function() {
    $(".avatar").click(function() {
        var chosenAvatarName = $(this).attr("alt"); //name
        var chosenAvatarImage = $(this).attr("src"); //image

        // Update the chosen avatar container with the selected avatar
        $(".chosen_avatar").html(`Chosen Avatar: <img class="avatar" src="${chosenAvatarImage}" alt="${chosenAvatarName}">${chosenAvatarName}`);

        $("#avatar_image_input").val(chosenAvatarImage);
    });
});