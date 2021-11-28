# webcraft-server

This is the server for [WebCraft](https://github.com/voces/webcraft). It
creates singleton instances WebCraft games which authenicated users can join.
Note WebCraft games are not sandboxed and should be run with caution.

## Usage

```bash
> git clone https://github.com/voces/webcraft-server.git
> cd webcraft-server
> npm ci
> npm run build
> npm start
```

Games are hardcoded in the `games.txt` file. The latest version from npm is
fetched and stored in `maps/`. If the version in `maps/` does not match, it'll
be replaced unless it is a symbolic link.
