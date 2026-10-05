"use client";

import { useState, type SubmitEvent } from "react";

export default function PerformanceForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ageRating, setAgeRating] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    // SubmitEvent → submit할 때 발생하는 React 이벤트
    /* <HTMLFormElement> → 그 이벤트가 발생한 대상은 form */

    e.preventDefault();
    setIsLoading(true);

    const request = {
      title,
      description,
      category,
      ageRating,
    };
    console.log(request);

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/admin/performances",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );
      console.log(response.status);

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setMessage("공연이 등록되었습니다.");

        setTitle("");
        setDescription("");
        setCategory("");
        setAgeRating("");
      } else {
        setMessage("공연 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      setMessage("서버에 연결할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">공연</label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <hr />
      <div>
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="category">카테고리</label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="" disabled>
            카테고리를 선택하세요
          </option>
          <option value="MUSICAL">MUSICAL</option>
          <option value="PLAY">PLAY</option>
          <option value="CONCERT">CONCERT</option>
        </select>
      </div>

      <div>
        <label htmlFor="ageRating">연령 등급</label>
        <select
          id="ageRating"
          name="ageRating"
          value={ageRating}
          onChange={(e) => setAgeRating(e.target.value)}
        >
          <option value="" disabled>
            연령 등급을 선택하세요
          </option>
          <option value="ALL">ALL</option>
          <option value="ADULT">ADULT</option>
        </select>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "등록 중..." : "공연 등록"}
      </button>
      <p>{message}</p>
    </form>
  );
}
