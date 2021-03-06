
let currentUser = null;
$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $author=$("#author");
  const $title=$("#title");
  const $url=$("#url");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $submitStory=$("#nav-submit-story");
  const $favorites=$("#nav-favorites");
  const $myStories=$("#nav-my-stories");
  const $favoritedArticles = $("#favorited-articles");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  
  

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    if(username ==='' || password === ''){ 
      $("#error-msg-2").remove() 
      $loginForm.append(`<div id="error-msg-2"><b>All fields are required to log in<b></'div'>`)
      return
    }

    // call the login static method to build a user instance

    const userInstance = await User.login(username, password);
   
    // catch {
    //   $loginForm.append(`<div id="error-msg-4"><b>Incorrect credentials<b></'div'>`)
    //   return
    // }

      currentUser = userInstance; 
      //testing
     $("#profile-name").html(`<div id="profile-name"><b>Name:</b> ${currentUser.name}</div>`)
     $("#profile-username").html(`<div id="profile-username"><b>Username:</b> ${currentUser.username}</div>`)
     $("#profile-account-date").html(`<div id="profile-account-date"><b>Account Created:</b> ${currentUser.createdAt}</div>`)
     syncCurrentUserToLocalStorage();
     loginAndSubmitForm();

    }
    
    // set the global user to the user instance
   
  );

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val(); //get values from form 
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    if(name === '' || username ==='' || password === ''){ 
      $("#error-msg-1").remove() 
      $createAccountForm.append(`<div id="error-msg-1"><b>All fields are required to create an account<b></'div'>`)
      return
    }

    // if(username )
    // call the create method, which calls the API and then builds a new user instance
    
    const newUser = await User.create(username, password, name);
    
    // catch(err) {
    //   $createAccountForm.append(`<div id="error-msg-3"><b>This username has been taken. Please choose another one.<b></'div'>`)
    //   return
    // }
    
    currentUser = newUser; //both creating a new user and logging in to the existing user defines this currentUser

    $("#profile-name").html(`<div id="profile-name"><b>Name:</b> ${currentUser.name}</div>`)
    $("#profile-username").html(`<div id="profile-username"><b>Username:</b> ${currentUser.username}</div>`)
    $("#profile-account-date").html(`<div id="profile-account-date"><b>Account Created:</b> ${currentUser.createdAt}</div>`)

    
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm(); //both creating a new user and logging in to an existing user calls this loginAndSubmitForm...
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  //Go to the submit story form when user clicks on "Submit a Story" anchor tag in navbar
  $submitStory.on("click", function(){
    //want to show the form to submit story(default is hidden)
    $submitForm.show();
    $allStoriesList.show();
  })

  //Once the values are entered...we need an eventlistener on the form to add the new story
  //Below
  $submitForm.on("submit", async function(e){
    e.preventDefault();
    //define the object to pass in
    const newStory={
    }
    //define the properties needed to pass in to the addStory method(grabbed from the DOM)
    newStory.title=$title.val()
    newStory.author=$author.val()
    newStory.url=$url.val()

    await storyList.addStory(currentUser, newStory) //call addStory and pass in what is needed
    await generateStories() //regenerate the list with this function which will add the new HTML of

    //ok so after submitting the form, we want to most likely create the html for "My Stories here..."
    $("#my-articles").empty(); //empty the list first so that we don't keep adding duplicates
    for (let story of currentUser.ownStories) {
      const result = generateMyStoryHTML(story);
      $ownStories.append(result);
    }

    // if $("#my-articles")
    // $("li").append(`<i class="fas fa-trash-alt"></i>`)
      // $(`<i class="fas fa-trash-alt"></i>`).insertBefore("i")
  })

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
    $("#favorite-error").remove()
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  $("body").on("click", ".fa-star", async function(){
    $("#favorite-error").remove() 
    $(this).toggleClass("favorited"); 
    //will add logic so that if the class is favorited we will add the favorite else (or else if)
    //it is not favorited then we will delete the favorite

    const $storyLi = $(this).parent() //gets the parent of the favorite button 
    const storyId = $storyLi.attr('id') //gives the storyId which is the same as the id of the element

    //this if else logic will run the addFavorite method if star is highlighted (has favorited class) or deleteFavorite if it is unhighlighted
    //(favorited class removed)
    if(!currentUser){
      $('.articles-container').append(`<div id="favorite-error"><b>Please log in or create an account to add favorites <b></div>`)
      return
    }

    if($(this).hasClass("favorited")){
      await currentUser.addFavorite(currentUser, storyId)
    } else {
      await currentUser.deleteFavorite(currentUser, storyId)
    }
     
    $("#favorited-articles").empty()
    for (let story of currentUser.favorites) {
      const result = generateStoryHTML(story);
      $favoritedArticles.append(result);
    }

  })

  $("body").on("click", ".fa-trash-alt", async function(){
    $(this).parent().remove() //want the story to physically be removed from the DOM of the my stories page

    const $storyLi = $(this).parent() //gets the parent of the favorite button 
    const storyId = $storyLi.attr('id')

    await storyList.deleteStory(currentUser, storyId) //its a method of story not user!
    await generateStories()
    alert('Your story has been removed')
  })

  


  $("body").on("click", "#nav-favorites", function(){
    //append each favorite the the favorited-articles ul
    $('#no-favorites').remove()
    hideElements();
    if (currentUser.favorites.length === 0){//if user has no stories
      $favoritedArticles.append(`<div id="no-favorites">Hello <b>${currentUser.username}</b>. You currently have no favorites. To favorite a story, please click on the star icon next to a story. </div>`)
    } 
    $favoritedArticles.show(); //want to show the favorites (default set to hidden)
   

  })

  $("body").on("click", "#nav-my-stories", function(){
    hideElements();
    $('#no-stories').remove()
    if (currentUser.ownStories.length === 0){//if user has no stories
      $ownStories.append(`<div id="no-stories">Hello <b>${currentUser.username}</b>. You currently have no stories. To create a story, click the "Submit a Story" link.</div>`)
    } 
    $ownStories.show();
  })

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset"); //hmm maybe can use these to reset the submit story forms?

    // show the stories
    $allStoriesList.show();

    checkIfLoggedIn();

    

   

  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateMyStoryHTML(story){
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-star"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="fas fa-star ${currentUser ? (currentUser.favorites.map( x => x.storyId).includes(story.storyId) ? "favorited": "''") : "''"}"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $favoritedArticles
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $submitStory.show();
    $favorites.show();
    $myStories.show();
    $("#favorite-error").remove() 
    // add
    $("#profile-name").html(`<div id="profile-name"><b>Name:</b> ${currentUser.name}</div>`)
    $("#profile-username").html(`<div id="profile-username"><b>Username:</b> ${currentUser.username}</div>`)
    $("#profile-account-date").html(`<div id="profile-account-date"><b>Account Created:</b> ${currentUser.createdAt}</div>`)

    //populate the users favorited stories
    for (let story of currentUser.favorites) {
      const result = generateStoryHTML(story);
      $favoritedArticles.append(result);
    }
  
    //populate the users own stories
    for (let story of currentUser.ownStories) {
      const result = generateMyStoryHTML(story);
      $ownStories.append(result);
    }

    // if currentUser.ownStories.conatains()
    // // $(`<i class="fas fa-trash-alt"></i>`).insertBefore("i")
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
