![logo](logo.png)

# Parliament of Poland MCP Server

An MCP server for the Polish Parliament public API.

## Usage

This server is designed to be run with `npx`, allowing you to use it as a tool provider for LLM clients without a global installation.

### Running with `npx`

To start the server, run the following command:

```bash
npx parliament-poland-mcp-server
```

### Configuration for LLM Clients

To integrate this server with an LLM client (like LM Studio or others that support MCP), you can configure it to spawn the server process. Here is an example configuration:

```json
{
  "mcpServers": {
    "parliament-poland-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "parliament-poland-mcp-server"
      ]
    }
  }
}
```

This configuration tells the client how to start the tool server.

## Server Functions

Tools are registered under the names below. Every tool that takes a `term` expects the Sejm term number (e.g. `10`); dates use the `YYYY-MM-DD` format.

### Terms

- `get-terms`: Get a list of Sejm terms.

### MPs

- `get-members`: Get a list of MPs for a given term.
- `get-member`: Get information about a member of Parliament.
- `get-member-photo`: Get the official photo of an MP (returned as an image; `mini` for a thumbnail).
- `get-member-votings`: Get how an MP voted in all votings on a given sitting day.

### Clubs

- `get-clubs`: Get a list of clubs for a given term.
- `get-club`: Get detailed information about a specific club (IDs are case-sensitive, e.g. `KO`, `PiS`).

### Committees

- `get-committees`: Get a list of committees for a given term.
- `get-committee`: Get detailed information about a specific committee (e.g. `ASW`, `SUE`).
- `get-committee-sittings`: Get a list of sittings of a specific committee.

### Proceedings and transcripts

- `get-proceedings`: Get a list of proceedings (sittings) for a given term, without agendas.
- `get-proceeding`: Get details of a single proceeding, with its agenda as plain text.
- `get-transcripts`: Get the list of statements (speakers) in the transcript of one sitting day.
- `get-transcript-statement`: Get the full text of a single statement.

### Votings

- `get-votings`: Get a list of votings for a given sitting.
- `get-voting`: Get details of a single voting, including how each MP voted (optionally filtered by `club`).
- `search-votings`: Search votings by title, date range or sitting.

### Legislative process and prints

- `get-processes`: Get a list of legislative processes (filters: `title`, `documentType`, `passed`, `modifiedSince`).
- `get-process`: Get information about a specific legislative process.
- `get-prints`: Get a list of prints for a given term.
- `get-print`: Get detailed information about a specific print (numbers like `128` or `128-A`).

### Interpellations and written questions

- `get-interpellations`: Get a list of interpellations (filters: `from` MP ID, `to`, `title`, `since`, `till`, `delayed`, `modifiedSince`).
- `get-interpellation`: Get detailed information about a specific interpellation.
- `get-written-questions`: Get a list of written questions (same filters as interpellations).

### Videos

- `get-videos`: Get a list of video recordings (filters: `title`, `type`, `comm`, `since`, `till`).

### Bilateral groups

- `get-bilateral-groups`: Get a list of bilateral groups for a given term.

### Responses and paging

- Data is returned as compact JSON after a short description line.
- List tools accept `offset` (default `0`) and `limit` (default `50`) and report which items were returned, the total when it is known, and the `offset` to use for the next page. Where the Sejm API does not support paging, the server pages the full list itself.
- A single response is capped at 80,000 characters. Lists are shortened to fit (and say so); larger single objects are truncated with a note.

## Development

To run the server in a development environment:

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Lint and typecheck: `npm run lint`, `npm run typecheck`
4.  Run unit tests: `npm test`
5.  Run live API integration tests (requires internet access): `npm run test:live-api`
6.  Build the project (runs lint, typecheck and tests first): `npm run build`
7.  Run the server: `npm start`

## Author

Piotr Kolawa ([@pkolawa](https://github.com/pkolawa)) / ([Linkedin](https://linkedin.com/in/pkolawa))

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
