# LLM invoice parsing setup

This app parses uploaded invoice images through the OpenAI Responses API and
uses the result to prefill the existing draft bill form.

## Required environment

Set these variables wherever the app runs:

```bash
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
OPENAI_INVOICE_MODEL="gpt-5.5"
```

`OPENAI_INVOICE_MODEL` is optional. The app defaults to `gpt-5.5`.

## Database

Run the app migrations before using invoice import:

```bash
yarn db:migrate
```

The MVP stores uploaded JPG/PNG bytes in Postgres in the
`invoice_documents` table. This keeps the implementation self-contained; object
storage can replace it later.

## How the flow works

1. Open Bills and click `New bill`.
2. Use `Import invoice image` to select a JPG or PNG.
3. The server stores the image in Postgres.
4. The server sends the image to OpenAI:
   - deployed app: backend image URL,
   - local app: base64 data URL fallback.
5. OpenAI returns `LlmExtractionResult<CreateBillInput>`.
6. The app validates the returned `data` with the existing bill schema.
7. The draft form is prefilled; the user still reviews and creates the draft.

## Codex hook points

The main files to inspect or modify from Codex are:

- `src/lib/actions/bills/parse-invoice-document.ts`: upload, storage, auth, and parser orchestration.
- `src/lib/invoice-parsing/openai.ts`: model, prompt, and structured output schema.
- `src/lib/invoice-parsing/schema.ts`: generic extraction envelope normalization into `CreateBillInput`.
- `src/app/(dashboard)/bills/_components/draft-bill-form.tsx`: frontend file input.

When changing extracted fields, update the OpenAI JSON schema and the Zod
normalization together. Keep `CreateBillInput` as the canonical draft creation
payload.
