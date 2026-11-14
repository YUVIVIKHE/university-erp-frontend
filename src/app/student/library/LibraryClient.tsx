"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, LibraryBookData, LibraryBookPage, StudentData, StudentLibraryData } from "@/lib/api";

export default function LibraryClient() {
  const [profile, setProfile] = useState<StudentData | null>(null);
  const [library, setLibrary] = useState<StudentLibraryData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<LibraryBookPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [bookDetails, setBookDetails] = useState<LibraryBookData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.studentPortal.me(),
      api.studentPortal.library(),
      api.studentPortal.libraryCategories(),
    ])
      .then(([student, data, bookCategories]) => {
        if (!active) return;
        setProfile(student);
        setLibrary(data);
        setCategories(bookCategories);
      })
      .catch((err) => {
        if (active) setError((err as { message?: string })?.message ?? "Failed to load library data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError(null);
    api.studentPortal.libraryBooks(search, category, availableOnly, page)
      .then((result) => {
        if (active) setCatalog(result);
      })
      .catch((err) => {
        if (active) setCatalogError((err as { message?: string })?.message ?? "Failed to load the book catalog.");
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, category, availableOnly, page]);

  useEffect(() => {
    if (selectedBookId === null) {
      setBookDetails(null);
      setDetailsError(null);
      return;
    }

    let active = true;
    setBookDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    api.studentPortal.libraryBook(selectedBookId)
      .then((book) => {
        if (active) setBookDetails(book);
      })
      .catch((err) => {
        if (active) setDetailsError((err as { message?: string })?.message ?? "Failed to load book details.");
      })
      .finally(() => {
        if (active) setDetailsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBookId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !library || !profile) return <div className="p-8 text-red-500 text-sm">{error ?? "Library data unavailable."}</div>;

  const summary = library.summary;
  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Library</h1>
        <p className="text-slate-400 text-sm mt-1">{profile.program} · Semester {profile.semester}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Titles available" value={summary.totalTitles} tone="indigo" />
        <SummaryCard label="Available copies" value={summary.availableCopies} tone="green" />
        <SummaryCard label="Books issued" value={summary.borrowedByMe} tone="amber" />
        <SummaryCard label="Overdue" value={summary.overdueByMe} tone="rose" />
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Book catalog</h2>
          <p className="text-xs text-slate-400 mt-1">Search by title, author, accession number, or ISBN.</p>
        </div>

        <form onSubmit={applySearch} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] gap-3">
          <label className="sr-only" htmlFor="library-search">Search books</label>
          <input
            id="library-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            maxLength={100}
            placeholder="Search books"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => {
                setPage(0);
                setAvailableOnly(event.target.checked);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Available copies only
          </label>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Search
          </button>
        </form>

        <label className="flex max-w-sm flex-col gap-1 text-xs font-medium text-slate-500">
          Category
          <select
            value={category}
            onChange={(event) => {
              setPage(0);
              setCategory(event.target.value);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">All categories</option>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>

        {catalogError ? (
          <p role="alert" className="text-sm text-red-600">{catalogError}</p>
        ) : catalogLoading ? (
          <p role="status" className="py-4 text-sm text-slate-400">Loading catalog…</p>
        ) : !catalog || catalog.content.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">No books match these filters.</p>
        ) : (
          <>
            <div className="space-y-3">
              {catalog.content.map((book) => (
                <article key={book.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-700">{book.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{book.author}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {book.category ?? "General"} · Accn: {book.accessionNo} · {book.availableCopies}/{book.totalCopies} available
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBookId((current) => current === book.id ? null : book.id)}
                      aria-expanded={selectedBookId === book.id}
                      className="self-start rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      {selectedBookId === book.id ? "Hide details" : "Book details"}
                    </button>
                  </div>
                  {selectedBookId === book.id && (
                    <div className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
                      {detailsLoading ? (
                        <p role="status">Loading book details…</p>
                      ) : detailsError ? (
                        <p role="alert" className="text-red-600">{detailsError}</p>
                      ) : bookDetails ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <p><span className="text-slate-400">ISBN:</span> {bookDetails.isbn ?? "Not provided"}</p>
                          <p><span className="text-slate-400">Publisher:</span> {bookDetails.publisher ?? "Not provided"}</p>
                          <p><span className="text-slate-400">Shelf:</span> {bookDetails.shelf ?? "Not assigned"}</p>
                          <p><span className="text-slate-400">Copies issued:</span> {bookDetails.issuedCopies}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </article>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {catalog.totalElements} {catalog.totalElements === 1 ? "title" : "titles"}
                {catalog.totalPages > 0 && ` · Page ${catalog.number + 1} of ${catalog.totalPages}`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0 || catalogLoading}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={catalogLoading || page + 1 >= catalog.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">My issued books</h2>
          <span className="text-xs text-slate-400">Borrowing</span>
        </div>

        <div className="space-y-3">
          {library.issued.length === 0 ? (
            <div className="text-sm text-slate-400">No books currently issued to you.</div>
          ) : (
            library.issued.map((issue) => (
              <div key={issue.id} className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-700">{issue.bookTitle}</p>
                    <p className="text-xs text-slate-400 mt-1">{issue.accessionNo}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                    issue.status === "ISSUED" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>
                    {issue.status}{issue.daysOverdue > 0 ? ` · ${issue.daysOverdue} days overdue` : ""}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <p className="text-slate-400">Issue date</p>
                    <p>{issue.issueDate ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Due date</p>
                    <p>{issue.dueDate ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Returned</p>
                    <p>{issue.returnDate ?? "Not yet"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Estimated fine</p>
                    <p>{issue.estimatedFine ? `₹${issue.estimatedFine}` : "₹0"}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "indigo" | "green" | "amber" | "rose" }) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xl font-black ${styles[tone]}`}>{value}</p>
    </div>
  );
}
