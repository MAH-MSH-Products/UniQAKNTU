# Documentation Constraints

## 🎯 Core Principle: File-Centric Documentation

**DO NOT** write task-based summaries (e.g., "In Task 2-D, I implemented learning curves...").  
**DO** maintain file-centric documentation that evolves with the codebase.

---

## 📋 Documentation Rules

### Rule 1: Modified Files Must Have Updated Documentation
If your task modifies an existing file (e.g., `safety_filter.py`, `train_dqn.py`):
- **Check**: Does `documentation/<filename>.md` already exist?
    - **YES** → Update the existing documentation to reflect your changes
    - **NO** → Create new documentation for the entire file

### Rule 2: New Files Require Full Documentation
If your task creates a new file (e.g., `curriculum_callbacks.py`, `plot_learning_curves.py`):
- **Always** create corresponding `documentation/<new_filename>.md`
- Document the file's purpose, architecture, usage, and integration points

### Rule 3: Documentation Structure
Each `<filename>.md` should contain:
```markdown
# <Filename> Documentation

## Purpose
What does this file do? Why does it exist?

## Key Components
- Classes/Functions defined
- Input/Output specifications
- Dependencies

## Usage
How to use this file (CLI commands, API calls, configuration)

## Integration
How this file interacts with other modules

## Change Log (Optional)
- Date: What changed and why (only for significant updates)
```

---

## ✅ Examples

### Example A: Modifying Existing File
**Scenario**: You modified `training/train_dqn.py` to add curriculum training.

**Action**:
1. Check if `documentation/train_dqn.md` exists
2. If YES: Add a section "Curriculum Training Mode" explaining the new `--curriculum` flag and `train_curriculum()` function
3. If NO: Create full documentation covering both original and new functionality

**❌ WRONG** (Task-based):
> "In Task 2-B, I added curriculum training to train_dqn.py with 4 stages..."

**✅ RIGHT** (File-based):
> In `documentation/train_dqn.md`:
> ## Curriculum Training Mode
> When invoked with `--curriculum <config.yaml>`, the script executes multi-stage curriculum learning...

---

### Example B: Creating New File
**Scenario**: You created `evaluation/plot_learning_curves.py`.

**Action**:
1. Create `documentation/plot_learning_curves.md`
2. Document:
    - Purpose: Generate learning curve visualizations from curriculum training CSV logs
    - Functions: `plot_learning_curves()`, `plot_stage_comparison()`
    - Usage: `python evaluation/plot_learning_curves.py --csv-dir logs --output-dir results/curriculum`
    - Output formats and customization options

---

### Example C: No Documentation Needed
**Scenario**: You only modified a config YAML file (e.g., `configs/env_config_stage1.yaml`).

**Action**:
- Config files typically don't need separate `.md` documentation unless they introduce complex new patterns
- Inline comments in YAML are sufficient for simple parameter changes
- If the config introduces a new system (e.g., curriculum staging), document it in the parent system doc (e.g., `documentation/curriculum_system.md`)

---

## 🚫 Anti-Patterns to Avoid

| ❌ Don't Do This | ✅ Do This Instead |
|-----------------|-------------------|
| "Task 2-D Summary: I implemented learning curves..." | Update `documentation/plot_learning_curves.md` with file purpose and usage |
| "Work Log: Monday I fixed bugs in safety_filter.py" | Update `documentation/safety_filter.md` with bug fix details and new behavior |
| Creating `documentation/task_2d_summary.md` | Updating `documentation/<affected_files>.md` |
| Writing "Member 1 completed X on date Y" | Writing "This module provides X functionality for Y use case" |

---

## 🔍 Verification Checklist

Before committing, ask:
1. [ ] Did I modify any `.py` files?
2. [ ] For each modified `.py` file, does corresponding `documentation/<filename>.md` exist?
    - If YES: Did I update it with my changes?
    - If NO: Did I create it with full file documentation?
3. [ ] Did I create any new `.py` files?
    - If YES: Did I create `documentation/<newfile>.md`?
4. [ ] Is my documentation file-focused (not task-focused)?
5. [ ] Would a new developer understand this file by reading its `.md` without knowing which task created it?

---

## 📁 File Naming Convention

- Python file: `training/train_dqn.py`
- Documentation: `documentation/train_dqn.md`
- Python file: `evaluation/plot_learning_curves.py`
- Documentation: `documentation/plot_learning_curves.md`

**Note**: Use the base filename without directory path or extension for the `.md` file name.

---

## 🎓 Rationale

**Why file-centric?**
- Codebases outlive tasks and team members
- Future developers search by filename, not task number
- Tasks are temporary; files are permanent
- Easier to verify completeness: "Does every `.py` have a `.md`?"

**Why not task-centric?**
- Task docs become obsolete when tasks are forgotten
- Creates redundant information scattered across task summaries
- Hard to maintain as files evolve across multiple tasks
- Violates single-source-of-truth principle

---

## 📞 Quick Reference

**Modified `safety_filter.py`?**
→ Update `documentation/safety_filter.md`

**Created `curriculum_callbacks.py`?**
→ Create `documentation/curriculum_callbacks.md`

**Changed `idm_controller.py` but no doc exists?**
→ Create full `documentation/idm_controller.md`

**Finished Task 2-D?**
→ DO NOT create `documentation/task_2d.md`
→ DO update docs for all files you touched in Task 2-D

---

*This constraint document ensures sustainable, maintainable documentation that serves future developers rather than tracking past tasks.*