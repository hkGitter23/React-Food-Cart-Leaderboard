# Alternatives to Scope CSS Without Affecting Whole Website

## Option 1: Body/HTML Class Wrapper (Recommended)

Add a unique class to body/html on this page, then scope CSS to that class.

### Implementation:

**1. Update page.js:**
```javascript
'use client';
import { useEffect } from 'react';
import './page.css';

export default function Login() {
  useEffect(() => {
    // Add class to body when page loads
    document.body.classList.add('login-page');
    
    // Remove class when page unmounts
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  return (
    <div className="login-container">
      <h1>Food Truck Leaderboard</h1>
      {/* ... rest of form */}
    </div>
  );
}
```

**2. Update page.css:**
```css
/* Only apply when body has login-page class */
body.login-page h1 {
  color: #ffa826;
}

body.login-page form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* etc. */
```

---

## Option 2: Unique Prefix for All Classes

Prefix all your classes with a unique identifier like `login-`:

### Implementation:

**page.css:**
```css
.login-container { ... }

/* Prefix everything with login- */
.login-h1 {
  color: #ffa826;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-label { ... }
.login-input { ... }
.login-button { ... }
```

**page.js:**
```javascript
<div className="login-container">
  <h1 className="login-h1">Food Truck Leaderboard</h1>
  <form className="login-form">
    <label className="login-label">...</label>
    {/* etc. */}
  </form>
</div>
```

---

## Option 3: CSS Modules with String Access (Best of Both Worlds)

Use CSS Modules but access classnames as strings using bracket notation.

### Implementation:

**1. Rename to page.module.css:**
```css
.loginContainer { ... }
.heading { color: #ffa826; }
.form { ... }
/* etc. */
```

**2. Use bracket notation to access as strings:**
```javascript
import styles from './page.module.css';

export default function Login() {
  return (
    <div className={styles['loginContainer']}>
      <h1 className={styles['heading']}>Food Truck Leaderboard</h1>
      <form className={styles['form']}>
        {/* etc. */}
      </form>
    </div>
  );
}
```

---

## Option 4: Data Attribute Scoping

Use a data attribute on the container and scope CSS to it.

### Implementation:

**page.js:**
```javascript
<div className="login-container" data-page="login">
  <h1>Food Truck Leaderboard</h1>
  {/* etc. */}
</div>
```

**page.css:**
```css
[data-page="login"] h1 {
  color: #ffa826;
}

[data-page="login"] form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

---

## Option 5: Scoped CSS with a Helper Function

Create a helper to generate scoped class names.

### Implementation:

**utils/scopedCSS.js:**
```javascript
export function scopeClass(baseClass, scope = 'login') {
  return `${scope}-${baseClass}`;
}
```

**page.css:**
```css
.login-container { ... }
.login-h1 { color: #ffa826; }
.login-form { ... }
/* etc. */
```

**page.js:**
```javascript
import { scopeClass } from '../../utils/scopedCSS';
import './page.css';

export default function Login() {
  return (
    <div className="login-container">
      <h1 className={scopeClass('h1')}>Food Truck Leaderboard</h1>
      <form className={scopeClass('form')}>
        {/* etc. */}
      </form>
    </div>
  );
}
```

---

## Comparison

| Method | Pros | Cons |
|--------|------|------|
| **Body Class** | Clean CSS, automatic | Requires useEffect |
| **Unique Prefix** | Simple, explicit | Repetitive class names |
| **CSS Modules (bracket)** | Truly scoped, type-safe | Slightly different syntax |
| **Data Attribute** | Semantic, flexible | Slightly verbose CSS |
| **Helper Function** | Organized, reusable | Extra abstraction |

---

## My Recommendation

**Option 1 (Body Class)** or **Option 3 (CSS Modules with bracket notation)** are the cleanest approaches.

Would you like me to implement one of these?

