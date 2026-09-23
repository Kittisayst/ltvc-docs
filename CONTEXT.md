# ltvc-docs — Certificate Overlay Printing

A browser-only, single-user tool for printing text onto pre-printed certificate paper (ໃບຍ້ອງຍໍ). Solves two-pass overlay printing: paper already carries the border/seal/signature, and the app prints only the variable text at positions calibrated against a reference scan of the blank form.

## Language

**Template**:
A reusable certificate layout: one reference background image plus an ordered set of Fields. Represents one kind of form (e.g. "ໃບຍ້ອງຍໍ ພະນັກງານດີເດັ່ນ"). A Template does not hold any recipient data — only structure.
_Avoid_: Form, design, layout (as a noun for this entity)

**Reference Image**:
The scanned/photographed image of a blank certificate, uploaded once per Template and used only on-screen to position Fields. Never appears in printed output.
_Avoid_: Background, template image

**Field**:
A named slot defined on a Template: a label, an x/y position (calibrated by dragging over the Reference Image), and text styling (font, size, alignment). A Field has no value of its own — it is filled per Record.
_Avoid_: Placeholder, box, textbox

**Font**:
A font file (e.g. Phetsarath OT) uploaded into the system and assignable to one or more Fields. Stored locally; not bundled with the app.

**Record**:
One filled-in instance of a Template: a value for every Field, entered by hand, belonging to exactly one Template. A Record has its own system-generated identity, independent of any Field value — including a Field labeled "ເລກທີ", which is ordinary user-entered text and may be blank or duplicated.
_Avoid_: Certificate, entry, row (as the name for the data itself)

**Certificate**:
The physical printed sheet that results from printing a Record. Not a system entity — it exists only as an artifact of the Print action. Never conflate with Record: a Record can exist (and be edited or deleted) without a Certificate ever having been printed.

**Draft** / **Printed**:
The two states of a Record's lifecycle. A Record is Draft from creation until a Print action against it succeeds, at which point it becomes Printed and gains a `printedAt` timestamp. History treats Printed as the record of what was actually issued; Draft records are working data, not yet an issued certificate.
_Avoid_: Issued (use Printed as the canonical status name)

**History**:
The flat, searchable/filterable list of a Template's Records (filter by date or Field value, e.g. by "ເລກທີ"). Not a separate grouping entity — Records are not organized into named batches or sessions.
_Avoid_: Batch, session, print run (rejected as first-class concepts — see below)

## Rejected concepts

- **Batch/Session as an entity**: considered grouping Records under a named print run (e.g. "ພິທີມອບລາງວັນ 2026"). Rejected in favor of a flat, filterable Record list per Template — simpler, and filtering by date achieves the same grouping without forcing users to name a session before data entry.
