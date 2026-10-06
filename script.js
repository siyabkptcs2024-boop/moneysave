let db;
let items = [];

let type = "income";
let sumType = "daily";

const DB = "moneysave_db";
const STORE = "transactions";


function getToday() {

  return new Date()
    .toISOString()
    .slice(0, 10);

}


document.getElementById("date").value =
  getToday();

document.getElementById("selected").value =
  getToday();


/* DATABASE */

let request =
  indexedDB.open(DB, 1);


request.onupgradeneeded =
  function(event) {

    db = event.target.result;

    if (!db.objectStoreNames.contains(STORE)) {

      db.createObjectStore(
        STORE,
        {
          keyPath: "id",
          autoIncrement: true
        }
      );

    }

  };


request.onsuccess =
  function(event) {

    db = event.target.result;

    loadData();

  };


/* LOAD DATA */

function loadData() {

  let transaction =
    db.transaction(
      STORE,
      "readonly"
    );

  let store =
    transaction.objectStore(STORE);

  let req =
    store.getAll();


  req.onsuccess =
    function() {

      items =
        req.result || [];

      render();

    };

}


/* INCOME / EXPENSE */

function setType(newType) {

  type = newType;

  document
    .getElementById("inTab")
    .classList
    .toggle(
      "active",
      type === "income"
    );

  document
    .getElementById("exTab")
    .classList
    .toggle(
      "active",
      type === "expense"
    );

}


/* ADD */

function add() {

  let amountValue =
    Number(
      document
        .getElementById("amount")
        .value
    );


  if (
    !amountValue ||
    amountValue <= 0
  ) {

    alert(
      "Enter a valid amount"
    );

    return;

  }


  let item = {

    amount: amountValue,

    date:
      document
        .getElementById("date")
        .value ||
      getToday(),

    type: type,

    category:
      document
        .getElementById("cat")
        .value,

    note:
      document
        .getElementById("note")
        .value

  };


  let transaction =
    db.transaction(
      STORE,
      "readwrite"
    );


  let store =
    transaction.objectStore(STORE);


  store.add(item);


  transaction.oncomplete =
    function() {

      document
        .getElementById("amount")
        .value = "";

      document
        .getElementById("note")
        .value = "";

      loadData();

    };

}


/* DELETE */

function del(id) {

  let transaction =
    db.transaction(
      STORE,
      "readwrite"
    );


  transaction
    .objectStore(STORE)
    .delete(id);


  transaction.oncomplete =
    function() {

      loadData();

    };

}


/* CLEAR */

function clearAll() {

  if (!items.length) {

    alert(
      "No transactions"
    );

    return;

  }


  if (
    confirm(
      "Delete all transactions?"
    )
  ) {

    let transaction =
      db.transaction(
        STORE,
        "readwrite"
      );


    transaction
      .objectStore(STORE)
      .clear();


    transaction.oncomplete =
      function() {

        loadData();

      };

  }

}


/* MONEY */

function money(value) {

  return "₹" +
    Number(value || 0)
      .toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2
        }
      );

}


/* TOTAL */

function total(
  list,
  transactionType
) {

  return list

    .filter(
      item =>
        item.type === transactionType
    )

    .reduce(
      (sum, item) =>
        sum +
        Number(item.amount),
      0
    );

}


/* DATE LIST */

function dateList(date) {

  return items.filter(
    item =>
      item.date === date
  );

}


/* STATS */

function stats(list) {

  let income =
    total(list, "income");

  let expense =
    total(list, "expense");

  let saving =
    income - expense;


  return `

    <div class="mini">

      <div>
        <small>Income</small>
        <br>
        <b class="plus">
          ${money(income)}
        </b>
      </div>

      <div>
        <small>Expense</small>
        <br>
        <b class="minus">
          ${money(expense)}
        </b>
      </div>

      <div>
        <small>Saving</small>
        <br>
        <b>
          ${money(saving)}
        </b>
      </div>

    </div>

  `;

}


/* TRANSACTION HTML */

function transactionHTML(list) {

  if (!list.length) {

    return `
      <div class="empty">
        No transactions found.
      </div>
    `;

  }


  return list

    .slice()

    .sort(
      (a, b) =>
        b.date.localeCompare(a.date)
    )

    .map(item => {

      let sign =
        item.type === "income"
          ? "+"
          : "-";

      let color =
        item.type === "income"
          ? "plus"
          : "minus";


      return `

        <div class="tx">

          <div>

            <b>
              ${escapeHTML(
                item.category ||
                "Other"
              )}
            </b>

            <div class="meta">

              ${item.date}

              ${
                item.note
                  ? " • " +
                    escapeHTML(
                      item.note
                    )
                  : ""
              }

            </div>

          </div>


          <div class="${color}">

            ${sign}${money(item.amount)}

            <button
              class="del"
              onclick="del(${item.id})">
              ×
            </button>

          </div>

        </div>

      `;

    })

    .join("");

}


/* MAIN RENDER */

function render() {

  let income =
    total(items, "income");

  let expense =
    total(items, "expense");


  let selectedDate =
    document
      .getElementById("selected")
      .value ||
    getToday();


  let selectedItems =
    dateList(selectedDate);


  document
    .getElementById("income")
    .textContent =
    money(income);


  document
    .getElementById("expense")
    .textContent =
    money(expense);


  document
    .getElementById("net")
    .textContent =
    money(
      income - expense
    );


  let dailyIncome =
    total(
      selectedItems,
      "income"
    );


  let dailyExpense =
    total(
      selectedItems,
      "expense"
    );


  document
    .getElementById("saving")
    .textContent =
    money(
      dailyIncome -
      dailyExpense
    );


  document
    .getElementById("todayLabel")
    .textContent =
    selectedDate === getToday()
      ? "Today"
      : selectedDate;


  document
    .getElementById("dayStats")
    .innerHTML =
    stats(selectedItems);


  document
    .getElementById("dayTx")
    .innerHTML =
    transactionHTML(
      selectedItems
    );


  document
    .getElementById("all")
    .innerHTML =
    transactionHTML(items);


  renderSummary();

}


/* SUMMARY */

function summary(
  summaryType,
  button
) {

  sumType =
    summaryType;


  let buttons =
    button
      .parentElement
      .querySelectorAll(
        "button"
      );


  buttons.forEach(
    item =>
      item.classList
        .remove("active")
  );


  button.classList
    .add("active");


  renderSummary();

}


/* WEEK */

function getWeekRange() {

  let today =
    new Date();


  let day =
    today.getDay() || 7;


  let start =
    new Date(today);


  start.setDate(
    today.getDate() -
    day +
    1
  );


  let end =
    new Date(start);


  end.setDate(
    start.getDate() +
    6
  );


  return {

    start:
      start
        .toISOString()
        .slice(0, 10),

    end:
      end
        .toISOString()
        .slice(0, 10)

  };

}


/* SUMMARY RENDER */

function renderSummary() {

  let list = [];

  let title = "";


  if (
    sumType === "daily"
  ) {

    let date =
      document
        .getElementById("selected")
        .value ||
      getToday();


    list =
      dateList(date);


    title =
      "Daily Summary • " +
      date;

  }


  if (
    sumType === "weekly"
  ) {

    let range =
      getWeekRange();


    list =
      items.filter(
        item =>
          item.date >=
            range.start &&
          item.date <=
            range.end
      );


    title =
      "Weekly Summary • " +
      range.start +
      " to " +
      range.end;

  }


  if (
    sumType === "monthly"
  ) {

    let selected =
      document
        .getElementById("selected")
        .value ||
      getToday();


    let month =
      selected.slice(0, 7);


    list =
      items.filter(
        item =>
          item.date
            .startsWith(month)
      );


    title =
      "Monthly Summary • " +
      month;

  }


  let categoryTotals = {};


  list

    .filter(
      item =>
        item.type === "expense"
    )

    .forEach(item => {

      let category =
        item.category ||
        "Other";


      categoryTotals[category] =
        (
          categoryTotals[category] ||
          0
        ) +
        Number(item.amount);

    });


  let categoryHTML =

    Object.entries(
      categoryTotals
    )

    .sort(
      (a, b) =>
        b[1] - a[1]
    )

    .map(
      ([category, amount]) => `

        <div class="cat">

          <span>
            💸
            ${escapeHTML(category)}
          </span>

          <b>
            ${money(amount)}
          </b>

        </div>

      `
    )

    .join("");


  document
    .getElementById("summary")
    .innerHTML = `

      <div class="summarybox">

        <b>
          ${title}
        </b>

        ${stats(list)}

        <h3>
          Expense by Category
        </h3>

        ${
          categoryHTML ||
          `
            <div class="empty">
              No expense data.
            </div>
          `
        }

      </div>

    `;

}


/* DASHBOARD CARD */

function metric(typeName) {

  let selectedDate =
    document
      .getElementById("selected")
      .value ||
    getToday();


  let list =
    typeName === "saving"
      ? dateList(selectedDate)
      : items;


  let income =
    total(list, "income");


  let expense =
    total(list, "expense");


  let value;


  if (
    typeName === "income"
  ) {

    value = income;

  }

  else if (
    typeName === "expense"
  ) {

    value = expense;

  }

  else {

    value =
      income - expense;

  }


  let title;


  if (
    typeName === "balance"
  ) {

    title =
      "💰 Net Balance Summary";

  }

  else if (
    typeName === "income"
  ) {

    title =
      "📈 Income Summary";

  }

  else if (
    typeName === "expense"
  ) {

    title =
      "💸 Expense Summary";

  }

  else {

    title =
      "🏦 Daily Savings";

  }


  document
    .getElementById("mt")
    .textContent =
    title;


  document
    .getElementById("mc")
    .innerHTML = `

      <div class="summarybox">

        <div
          style="
            text-align:center;
            font-size:30px;
            padding:15px;
          "
        >

          <b>
            ${money(value)}
          </b>

        </div>

        ${stats(list)}

        ${transactionHTML(list)}

      </div>

    `;


  document
    .getElementById("modal")
    .classList
    .remove("hide");

}


/* CLOSE MODAL */

function closeM() {

  document
    .getElementById("modal")
    .classList
    .add("hide");

}


/* THEME */

function theme() {

  document.body
    .classList
    .toggle("light");


  localStorage.setItem(

    "moneyTheme",

    document.body
      .classList
      .contains("light")
      ? "light"
      : "dark"

  );

}


if (
  localStorage.getItem(
    "moneyTheme"
  ) === "light"
) {

  document.body
    .classList
    .add("light");

}


/* SECURITY */

function escapeHTML(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      function(char) {

        return {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        }[char];

      }
    );

}
