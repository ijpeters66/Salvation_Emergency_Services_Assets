# Client Feedback - Ronald

Date: 2026-06-27

## TODO list

### Locations

- [x] Add `Corps` as an option for `Location Type`.

### Assets

- [ ] Review whether any asset changes are needed.

### Consumables

- [x] Update created consumable categories:
  - remove `Clinical`
  - remove `Logistics`
  - add `Food/Water`
  - add `Material Aid`
- [x] In create batch, remove mandatory fields for `Batch Number` and `Date Received`.
- [x] When creating a batch, make `Qty Received` automatically add to stock on hand.
- [x] In create batch, remove `Qty on Hand` and `Replacement Cost` fields.
- [x] When `Qty Received` is added, it should automatically update `Qty on Hand`.
- [x] Add the ability to edit an existing consumable after creation.

## Implementation notes

- The batch detail page already includes an `Edit batch` form. It now keeps quantity-on-hand aligned to the edited `Qty Received` value.
- Create batch now auto-generates a batch/lot number and received date when those fields are not shown.
- Asset changes still need workflow review with Ronald before changing anything.

## Draft reply

Hi Ronald,

Thanks for sending through the issues you found. I’ve captured them as the next work list and I’ll work through them in order.

Admin login details:
- Email: `admin@email.com`
- Password: `admin123!`

Once you sign in, you should have admin access.

Thanks,
Ian

## Notes

- Treat the admin login as admin-only access.
- If needed, we can rotate the password after first sign-in.
