// CIDR Calculator Constants

// IPv4 Constants
export const PRIVATE_RANGES = [
    { start: "10.0.0.0", end: "10.255.255.255", cidr: "10.0.0.0/8", name: "Class A Private" },
    { start: "172.16.0.0", end: "172.31.255.255", cidr: "172.16.0.0/12", name: "Class B Private" },
    { start: "192.168.0.0", end: "192.168.255.255", cidr: "192.168.0.0/16", name: "Class C Private" },
] as const;

export const RESERVED_RANGES = [
    { start: "0.0.0.0", end: "0.255.255.255", name: "Current network" },
    { start: "127.0.0.0", end: "127.255.255.255", name: "Loopback" },
    { start: "169.254.0.0", end: "169.254.255.255", name: "Link-local" },
    { start: "224.0.0.0", end: "239.255.255.255", name: "Multicast" },
    { start: "240.0.0.0", end: "255.255.255.255", name: "Reserved" },
] as const;

export const COMMON_PREFIX_LENGTHS = [
    { prefix: 8, name: "/8 (Class A)", hosts: 16777214 },
    { prefix: 16, name: "/16 (Class B)", hosts: 65534 },
    { prefix: 24, name: "/24 (Class C)", hosts: 254 },
    { prefix: 25, name: "/25", hosts: 126 },
    { prefix: 26, name: "/26", hosts: 62 },
    { prefix: 27, name: "/27", hosts: 30 },
    { prefix: 28, name: "/28", hosts: 14 },
    { prefix: 29, name: "/29", hosts: 6 },
    { prefix: 30, name: "/30 (Point-to-point)", hosts: 2 },
    { prefix: 31, name: "/31 (Point-to-point RFC 3021)", hosts: 2 },
    { prefix: 32, name: "/32 (Host)", hosts: 1 },
] as const;

export const IP_CLASSES = [
    { class: "A", start: 0, end: 127, defaultPrefix: 8 },
    { class: "B", start: 128, end: 191, defaultPrefix: 16 },
    { class: "C", start: 192, end: 223, defaultPrefix: 24 },
    { class: "D", start: 224, end: 239, defaultPrefix: 0, name: "Multicast" },
    { class: "E", start: 240, end: 255, defaultPrefix: 0, name: "Reserved" },
] as const;

export const MIN_PREFIX_LENGTH = 0;
export const MAX_PREFIX_LENGTH = 32;
export const MAX_IP_VALUE = 255;
export const IP_OCTETS = 4;
export const BITS_PER_OCTET = 8;
export const TOTAL_IP_BITS = 32;

// IPv6 Constants
export const IPV6_GROUPS = 8;
export const IPV6_BITS_PER_GROUP = 16;
export const IPV6_TOTAL_BITS = 128;
export const IPV6_MAX_PREFIX_LENGTH = 128;
export const IPV6_MAX_GROUP_VALUE = 0xFFFF;

export const IPV6_PRIVATE_RANGES = [
    { start: "fc00::", end: "fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", cidr: "fc00::/7", name: "Unique Local Address (ULA)" },
    { start: "fe80::", end: "febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff", cidr: "fe80::/10", name: "Link-Local" },
] as const;

export const IPV6_RESERVED_RANGES = [
    { start: "::", end: "::", name: "Unspecified" },
    { start: "::1", end: "::1", name: "Loopback" },
    { start: "ff00::", end: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff", name: "Multicast" },
    { start: "2001:db8::", end: "2001:db8:ffff:ffff:ffff:ffff:ffff:ffff", name: "Documentation" },
] as const;

export const IPV6_COMMON_PREFIX_LENGTHS = [
    { prefix: 32, name: "/32 (RIR allocation)", hosts: "79228162514264337593543950336" },
    { prefix: 48, name: "/48 (Site prefix)", hosts: "1208925819614629174706176" },
    { prefix: 56, name: "/56 (Typical ISP allocation)", hosts: "4722366482869645213696" },
    { prefix: 64, name: "/64 (Single subnet)", hosts: "18446744073709551616" },
    { prefix: 128, name: "/128 (Single host)", hosts: "1" },
] as const;
