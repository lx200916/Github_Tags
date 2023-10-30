import { useState, useEffect } from "react"

import "./App.css"
import {
  MagnifyingGlassIcon,
  QuoteIcon,
  SewingPinFilledIcon
} from "@radix-ui/react-icons"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { Badge } from "@/components/ui/badge"
function App() {
  const [tags, setTags] = useState([])
  const [allTags, setAllTags] = useState(["来测", "1"])
  const [data, setData] = useState({})
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState([])
  return (
    useEffect(() => {
      const root = window.document.documentElement
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
    }, []),
    useEffect(async () => {
      let tags = await chrome.runtime.sendMessage({
        type: "getTags"
      })
      const keys = Object.keys(tags)
      console.log(tags)
      setAllTags(keys)
      setData(tags)
      // Get randomly 10 of the value of tags[key]
      let result = new Set()
      for (let i = 0; i < 10; i++) {
        let key = keys[Math.floor(Math.random() * keys.length)]
        for (let j = 0; j < tags[key].length; j++) {
          result.add(tags[key][j])
        }
      }
      setResult([...result])
    }, []),
    useEffect(() => {
      if (tags.length == 0) {
        // setResult([])
        return
      }
      //Filter the result with all the tags
      // let result = new Set()
      let bitmap = {}
      for (let i = 0; i < tags.length; i++) {
        for (let j = 0; j < data[tags[i]].length; j++) {
          bitmap[data[tags[i]][j]] = bitmap[data[tags[i]][j]]
            ? bitmap[data[tags[i]][j]] + 1
            : 1
        }
      }
      let result = []
      for (let key in bitmap) {
        if (bitmap[key] == tags.length) {
          result.push(key)
        }
      }
      setResult([...result])
    }, [tags]),
    (
      <div className="mx-auto container p-8">
        <div className="search h-8 ">
          <Popover className="w-full p-0" open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="w-full p-0">
              <div className="flex flex-wrap  rounded-md border border-input bg-transparent p-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <MagnifyingGlassIcon className=" flex-none w-6 h-6" />
                <div className="flex-none w-2"></div>
                {tags.length == 0 && (
                  <div
                    className="grow text-muted-foreground inline-flex items-center align-middle font-medium"
                    role="placeholder">
                    Input Tag to Filter
                  </div>
                )}
                {tags.length > 0 &&
                  tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="flex-none m-0.5"
                      onClick={() => setTags(tags.filter((v) => v != tag))}>
                      {tag}
                    </Badge>
                  ))}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className=" p-0"
              style={{ width: "var(--radix-popper-anchor-width)" }}>
              <div className="flex w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
                <SearchInput text={text} onTextChanged={setText} />
                <div className="-mx-1 h-px bg-border"> </div>
                <div className="flex flex-wrap p-3">
                  {allTags
                    .filter((tag) => tag.includes(text))
                    .map((tag) => (
                      <Badge
                        variant={tags.includes(tag) ? "primary" : "default"}
                        key={tag}
                        className={"m-0.5 h-5"}
                        onClick={() => setTags([...tags, tag])}>
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col mt-3">
          {result.map((userId) => (
            <UserCard
              key={userId}
              userId={userId}
              className="grow m-1"
              searchTags={tags}
              onClickTags={(tag) => {
                tags.includes(tag) ? null : setTags([...tags, tag])
              }}
            />
          ))}
        </div>
      </div>
    )
  )
}

const SearchInput = ({ text, onTextChanged }) => {
  return (
    <div className="flex  items-center border-b px-3  ">
      <MagnifyingGlassIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Search.."
        value={text}
        onChange={(e) => onTextChanged(e.target.value)}
      />
    </div>
  )
}
async function getUserTags(userId) {
  let tags = await chrome.runtime.sendMessage({
    type: "getItems",
    key: userId
  })
  return tags
}
const headers = new Headers({
  "x-requested-with": "XMLHttpRequest",
  referrer: "github.com"
})
const UserCard = ({ userId, className, searchTags, onClickTags }) => {
  const [user, setUser] = useState({})
  const [tags, setTags] = useState([])
  return (
    useEffect(() => {
      async function getData() {
        const response = await fetch(
          `https://github.com/users/${userId}/hovercard`,
          { headers: headers }
        )
        const html = await response.text()
        const parser = new DOMParser()
        const htmlDoc = parser.parseFromString(html, "text/html")
        const login_name = htmlDoc.querySelector(
          'section[aria-label$="login and name"]'
        )
        const login = login_name.querySelector("a").textContent
        const name =
          (login_name.querySelector("span") &&
            login_name.querySelector("span").textContent) ||
          null
        const bio =
          (htmlDoc.querySelector('section[aria-label$="bio"]') &&
            htmlDoc.querySelector('section[aria-label$="bio"]').textContent) ||
          null
        const address =
          (htmlDoc.querySelector('address[aria-label$="location"]') &&
            htmlDoc.querySelector('address[aria-label$="location"]')
              .textContent) ||
          null
        setUser({ login, name, bio, address })

        console.log(user)
        // setUser(user)
      }
      getData()
    }, [userId]),
    useEffect(() => {
      let getTags = async () => {
        let tags = await getUserTags(userId)
        console.log(tags)
        setTags(tags)
      }
      getTags()
    }, [userId]),
    (
      <div>
        <Card
          className={className}
          onClick={() => {
            window.open(`https://github.com/${userId}`)
          }}>
          <CardHeader className="flex flex-row">
            <img
              src={`https://github.com/${userId}.png`}
              className="rounded-full w-8 h-8"
            />
            <div className="grow ml-2">
              <CardTitle className="">
                {(user.login && user.name) || user.login || (
                  <Skeleton className="w-1/2 h-3" />
                )}
              </CardTitle>
              <CardDescription>{userId}</CardDescription>
            </div>
          </CardHeader>
          <CardContent style={{ marginTop: "-0.5rem" }}>
            {user.bio && (
              <p>
                <QuoteIcon className="mr-2" />
                <div>{user.bio}</div>
              </p>
            )}

            {user.address && (
              <p>
                <SewingPinFilledIcon className="mr-2" />
                <div>{user.address}</div>
              </p>
            )}
            <div className="inline-flex flex-wrap mt-2">
              {tags.map((tag) => (
                <Badge
                  variant={searchTags.includes(tag) ? "primary" : "default"}
                  key={tag}
                  className={"m-0.5 h-5"}
                  onClick={() => onClickTags(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  )
}
export default App
