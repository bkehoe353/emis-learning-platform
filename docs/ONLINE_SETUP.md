# Switching on online friends (Firebase)

Online friends let children find each other by nickname. Once added, a friend's points, league
and streak update by themselves. Until these steps are done, the site works exactly as before (offline).

It's free at this size. You'll need a Google account. It takes about 10 minutes.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project** (or **Add project**). Name it, for example, `emis-learning-platform`.
3. Google Analytics: choose **Not now / Disable**. The site doesn't need it, and it's better for children's privacy.
4. Click **Create project**, then **Continue**.

## 2. Turn on anonymous sign-in

Children don't make accounts or passwords. Each iPad gets an anonymous sign-in.

1. In the left menu: **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Anonymous**, switch it **on**, and **Save**.

## 3. Create the database

1. In the left menu: **Build → Firestore Database → Create database**.
2. Choose a location near you (for example **europe-west2 (London)**), then **Next**.
3. Choose **Start in production mode**, then **Create**.
4. Open the **Rules** tab. Delete what's there and paste in everything from the file **`firestore.rules`** in this project. Click **Publish**.

## 4. Get the two settings the website needs

1. Click the ⚙️ gear (top left) → **Project settings**.
2. Under **Your apps**, click the **`</>`** (Web) button. Give it a nickname (for example `website`), **don't** tick Hosting, then **Register app**.
3. Firebase shows a block of settings. You need two values:
   - `apiKey` (a long string starting with `AIza…`)
   - `projectId` (for example `emis-learning-platform`)
4. Send these two values to Claude, or put them into **`web/online-config.js`** yourself:

   ```js
   window.EMI_ONLINE = {
     apiKey: 'AIza…',
     projectId: 'emis-learning-platform',
   };
   ```

These values aren't passwords: Firebase web settings are designed to be visible in a web page. The security rules from step 3 are what protect the data.

## 5. Lock the key to your website (recommended)

So the key only works from Emi's site:

1. Open <https://console.cloud.google.com/apis/credentials> and pick your Firebase project at the top.
2. Click the key named **Browser key (auto created by Firebase)**.
3. Under **Application restrictions** choose **Websites**, add `https://bkehoe353.github.io/*`, and **Save**.

(For testing on your own computer, also add `http://localhost:8000/*`.)

## 6. Publish

Push the change. The site updates on GitHub Pages and the **🌐 Online friends** section in the Friends tab switches on.

## What goes online

Only for children who tap **Join online friends** (it asks them to check with a grown-up first):

- nickname, a short tag (like #K2P7), chosen emoji and background
- points, best Ranked league and time, day streak
- today's Friend Challenge score

Never: real names, email, location, photos, messages. Children can't message each other.
**Leave online friends** deletes the child's online profile straight away.

Anyone who has joined can search nicknames, so children should use a nickname rather than their full real name.

## Free limits

Firebase's free plan allows 50,000 reads and 20,000 writes per day. A group of friends uses a tiny fraction of that.
If you ever get close, Firebase stops serving rather than charging, unless you add a payment card (don't).
