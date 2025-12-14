export default {
    "prepare-commit-msg": "node scripts/gen-commit-msg.mjs $1",
    "commit-msg": "node scripts/check-commit-format.mjs $1"
};