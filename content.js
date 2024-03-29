;;(async function main() {
  async function getTags(ghUsername) {
    console.log("getTags", ghUsername)
    let tags = await chrome.runtime.sendMessage({
      type: "getItems",
      key: ghUsername
    })
    console.log("getTags", tags)
    if (tags == null || tags == undefined) {
      tags = []
    }
    return tags
  }
  var globalGHUsername = ""
  var globalTags = []
  function mutationCallback(mutationList, observer) {
    mutationList.forEach(async (mutation) => {
      if (mutation.type === "childList") {
        // console.log("A child node has been added or removed.");
        // console.log(mutation);
        if (mutation.addedNodes.length > 0) {
          console.log("Added nodes:")
          console.log(mutation.addedNodes)
          const hovercardNode = mutation.addedNodes[0].childNodes[0]
          const infoJson = hovercardNode.getAttribute("data-hydro-view")
          if (infoJson != null) {
            const info = JSON.parse(infoJson)
            // console.log(info);
            let ghUsername = info["payload"]["card_user_login"]
            if (ghUsername == null) {
              // Try new Dashboard?
              const ghUrl = info["payload"]["originating_url"]
              //github.com/users/codehz/hovercard?event_type=feeds.feed_click
              https: ghUsername = ghUrl.split("/")[4]
            }
            if (ghUsername != null) {
              console.log(ghUsername)
              let tags = await getTags(ghUsername)
              if (tags.length == 0) return
              const loginNameLabel = hovercardNode.querySelector(
                'section[aria-label$="login and name"]'
              )
              tags = tags.map(
                (tag) =>
                  `<span class="p-org Label Label--purple" style="margin:0 2px" title="${tag}">${tag}</span>`
              )
              if (loginNameLabel != null) {
                loginNameLabel.parentNode.innerHTML += `<section class="vcard-detail pt-1 hide-sm hide-md"  show_title="false" aria-label="Tags"><svg class="octicon octicon-organization" width="16" height="16" viewBox="0 -960 960 960"><path d="M569.652-109.348Q545.304-85 511-85t-58.652-24.348l-343-343q-11.3-11.6-17.824-27.05Q85-494.848 85-511v-281q0-34.244 24.378-58.622T168-875h281q16.62 0 31.299 5.837 14.679 5.837 27.081 18.208l343.272 343.064Q875-483.544 875-449.62t-24.348 58.272l-281 282ZM511.239-168l281-281L449-792H168v281l343.239 343ZM264-636q25 0 42.5-17.5T324-696q0-25-17.5-42.5T264-756q-25 0-42.5 17.5T204-696q0 25 17.5 42.5T264-636Zm-96-156Z"></path></svg>
                            ${tags.join("")}</li>
                            `
              }
            }
          }
        }
      }
    })
  }
  const config = { attributes: false, childList: true, subtree: false }

  console.log("Hello from github_tags")
  const containerNodes = document.querySelectorAll(
    ".Popover.js-hovercard-content>.Popover-message"
  )
  console.log(containerNodes)
  if (containerNodes != null) {
    containerNodes.forEach((node) => {
      const mutationObserver = new MutationObserver(mutationCallback)
      mutationObserver.observe(node, config)
    })
  }

  const updateProfilePage = async (ghUsername = null) => {
    const profileTabState =
      document.URL.endsWith("?tab=following") ||
      document.URL.endsWith("?tab=followers")
    if (profileTabState) return
    const profileHeader = document.querySelector(".js-profile-editable-area")
    const alreadyUpdated =
      document.querySelectorAll(".github-tags-details") != null &&
      document.querySelectorAll(".github-tags-details").length > 0
    if (
      profileHeader != null &&
      profileHeader.querySelector("ul.vcard-details") != null
    ) {
      const details = profileHeader.querySelector("ul.vcard-details")
      globalTags = await getTags(ghUsername || globalGHUsername)
      if (globalTags.length == 0) return
      if (alreadyUpdated) {
        document.querySelectorAll(".github-tags-details").forEach((node) => {
          node.remove()
        })
      }
      if (details == null) {
        profileHeader.innerHTML += `<ul class="vcard-details github-tags-details">
        <li class="vcard-detail pt-1 hide-sm hide-md" show_title="false"><svg class="octicon octicon-organization" viewBox="0 -960 960 960"  width="16" height="16" ><path d="M569.652-109.348Q545.304-85 511-85t-58.652-24.348l-343-343q-11.3-11.6-17.824-27.05Q85-494.848 85-511v-281q0-34.244 24.378-58.622T168-875h281q16.62 0 31.299 5.837 14.679 5.837 27.081 18.208l343.272 343.064Q875-483.544 875-449.62t-24.348 58.272l-281 282ZM511.239-168l281-281L449-792H168v281l343.239 343ZM264-636q25 0 42.5-17.5T324-696q0-25-17.5-42.5T264-756q-25 0-42.5 17.5T204-696q0 25 17.5 42.5T264-636Zm-96-156Z"></path></svg>
        ${globalTags.map(
          (tag) =>
            `<span class="p-org Label Label--purple" style="margin:0 2px" title="${tag}">${tag}</span>`
        )}</li></ul>`
      } else {
        details.innerHTML += `
        <li class="vcard-detail github-tags-details pt-1 hide-sm hide-md" show_title="false"><svg class="octicon octicon-organization" viewBox="0 -960 960 960"  width="16" height="16" ><path d="M569.652-109.348Q545.304-85 511-85t-58.652-24.348l-343-343q-11.3-11.6-17.824-27.05Q85-494.848 85-511v-281q0-34.244 24.378-58.622T168-875h281q16.62 0 31.299 5.837 14.679 5.837 27.081 18.208l343.272 343.064Q875-483.544 875-449.62t-24.348 58.272l-281 282ZM511.239-168l281-281L449-792H168v281l343.239 343ZM264-636q25 0 42.5-17.5T324-696q0-25-17.5-42.5T264-756q-25 0-42.5 17.5T204-696q0 25 17.5 42.5T264-636Zm-96-156Z"></path></svg>
        ${globalTags.map(
          (tag) =>
            `<span class="p-org Label Label--purple" style="margin:0 2px" title="${tag}">${tag}</span>`
        )}</li>
        `
      }
    }
  }
  async function handleTagButtonClick(event, ghUsername = null) {
    let tagString = window.prompt(
      "Enter tag name",
      (ghUsername && (await getTags(ghUsername))) || globalTags.join(",")
    )
    console.log(tagString)
    if (tagString != null) {
      let tags = tagString.split(",").map((tag) => tag.trim())
      // setItems(globalGHUsername, tags);
      await chrome.runtime.sendMessage({
        type: "setItems",
        key: ghUsername || globalGHUsername,
        value: tags
      })
      await updateProfilePage(ghUsername || globalGHUsername)
    }
  }
  const updateFollowButtons = async () => {
    const alreadyUpdated = document.querySelectorAll(".tags_button")
    if (alreadyUpdated != null && alreadyUpdated.length > 0) return
    const followButtons = document.querySelectorAll(
      "span.user-following-container.js-form-toggle-container"
    )
    if (followButtons != null && followButtons.length > 0) {
      const profileTabState =
        document.URL.endsWith("?tab=following") ||
        document.URL.endsWith("?tab=followers")
      globalGHUsername = followButtons[0]
        .querySelector(".js-form-toggle-target[action]")
        .getAttribute("action")
        .split("target=")[1]
      console.log(globalGHUsername)
      followButtons.forEach((button) => {
        ghUsername = profileTabState
          ? button
              .querySelector(".js-form-toggle-target[action]")
              .getAttribute("action")
              .split("target=")[1]
          : globalGHUsername
        const tagButton = document.createElement("button")
        tagButton.classList.add("btn", "btn-block", ".tags_button")
        tagButton.title = "tag user!"
        tagButton.setAttribute("aria-label", "tag user")
        tagButton.style.margin = "10px 0"
        tagButton.textContent = `🏷 Tag ${ghUsername}`
        tagButton.addEventListener(
          "click",
          handleTagButtonClick.bind(null, null, ghUsername)
        )
        button.appendChild(tagButton)
      })
    }
  }
  await updateFollowButtons()

  await updateProfilePage()
  window.addEventListener(
    "popstate",
    async (details) => {
      console.log(details)
      const url = new URL(details.target.location.href)
      if (url.host != "github.com") return
      if (
        details.url.endsWith("?tab=following") ||
        details.url.endsWith("?tab=followers")
      ) {
        await updateFollowButtons()
        return
      }
      await main()
    },
    { once: true }
  )
})()
