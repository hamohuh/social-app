import { useMemo } from "react";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import Cookies from "js-cookie";
import fetch from "isomorphic-unfetch";

//let apolloClient: ApolloClient<import("@apollo/client").NormalizedCacheObject>;
let apolloClient;
let token;
const isBrowser = typeof window !== "undefined";

const httpLink = new HttpLink({
  uri: "http://localhost:5000/graphql", // Server URL (must be absolute)
  credentials: "include", // Additional fetch() options like `credentials` or `headers`
  fetch
});

const authLink = setContext((_, { headers }) => {
  // get the authentication token from protected route context
  if (typeof window !== "undefined") {
    token = Cookies.get("token");
  }
  if (headers) {
    token = headers.token;
  }

  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      token: token ? token : ""
    }
  };
});

function createApolloClient() {
  return new ApolloClient({
    ssrMode: !isBrowser,
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
  });
}

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // get hydrated here
  if (initialState) {
    _apolloClient.cache.restore(initialState);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);

  return store;
}
