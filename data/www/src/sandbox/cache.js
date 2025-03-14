export const cached = (hash, create) => {
    const cache = new Map();
    return (value) => {
        const key = hash(value);
        let result = cache.get(key);
        if (result !== undefined)
            return result;
        result = create(value);
        cache.set(key, result);
        return result;
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2FuZGJveC9jYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLENBQUMsTUFBTSxNQUFNLEdBQUcsQ0FDcEIsSUFBd0IsRUFDeEIsTUFBNEIsRUFDNUIsRUFBRTtJQUNGLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFnQixDQUFBO0lBRXJDLE9BQU8sQ0FBQyxLQUFRLEVBQUUsRUFBRTtRQUNsQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFdkIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUUzQixJQUFJLE1BQU0sS0FBSyxTQUFTO1lBQUUsT0FBTyxNQUFNLENBQUE7UUFFdkMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUV0QixPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUMsQ0FBQTtBQUNILENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBjYWNoZWQgPSA8VCwgSGFzaCwgUmVzdWx0PihcclxuICBoYXNoOiAodmFsdWU6IFQpID0+IEhhc2gsXHJcbiAgY3JlYXRlOiAodmFsdWU6IFQpID0+IFJlc3VsdFxyXG4pID0+IHtcclxuICBjb25zdCBjYWNoZSA9IG5ldyBNYXA8SGFzaCwgUmVzdWx0PigpXHJcblxyXG4gIHJldHVybiAodmFsdWU6IFQpID0+IHtcclxuICAgIGNvbnN0IGtleSA9IGhhc2godmFsdWUpXHJcblxyXG4gICAgbGV0IHJlc3VsdCA9IGNhY2hlLmdldChrZXkpXHJcblxyXG4gICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcmVzdWx0XHJcblxyXG4gICAgcmVzdWx0ID0gY3JlYXRlKHZhbHVlKVxyXG4gICAgY2FjaGUuc2V0KGtleSwgcmVzdWx0KVxyXG5cclxuICAgIHJldHVybiByZXN1bHRcclxuICB9XHJcbn1cclxuIl19