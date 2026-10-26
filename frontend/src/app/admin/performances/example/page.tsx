type Performance = {
  id: number;
  title: string;
  description: string;
  category: string;
  ageRating: string;
};

export default async function PerformanceExample() {
  const url = "http://localhost:8080/api/v1/performances";
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("공연 목록 조회 실패");
  }

  const performances: Performance[] = await response.json();

  return (
    <main>
      <h1>공연 목록</h1>

      {performances.map((performance) => (
        <>
        <span>제목 : </span>

          <div key={performance.id}>
            <h2>{performance.title}</h2>
            <p>{performance.category}</p>
            <p>{performance.description}</p>
          </div>
        </>
      ))}
    </main>
  );
}
